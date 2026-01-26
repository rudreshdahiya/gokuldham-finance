#!/usr/bin/env python3
"""
RAG Document Processor for Jigri Financial Education
Parses NISM and Varsity PDFs, creates embeddings, stores in Supabase
"""

import os
import json
import hashlib
from pathlib import Path

# PDF parsing
try:
    import fitz  # PyMuPDF
except ImportError:
    print("Installing PyMuPDF...")
    os.system("pip install pymupdf")
    import fitz

# HTTP requests for API calls
import urllib.request
import urllib.parse

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyC4y7sw9IltmOGJ6t9LMhp4fTwGTQyLj8o")
SUPABASE_URL = "https://inssqicvvbsdpfboazfz.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_2_GInxBEmydd82C3W5aj0A_9_pBTM54")

# Document paths (in project root, not scripts folder)
PROJECT_ROOT = Path(__file__).parent.parent

DOCS = [
    {
        "path": "Module11_Personal-Finance.pdf",
        "source": "Varsity by Zerodha",
        "category": "personal_finance",
        "topics": ["budgeting", "retirement", "insurance", "planning"]
    },
    {
        "path": "NISM Series V-A Mutual Fund Distributors Certification Examination_November 2025_Final_04-Dec-2025 4 09.pdf",
        "source": "NISM V-A",
        "category": "mutual_funds",
        "topics": ["mutual_funds", "amc", "nav", "expense_ratio", "kyc"]
    },
    {
        "path": "NISM SERIES V-B MFF Workbook version-November- 2025 .pdf",
        "source": "NISM V-B",
        "category": "mutual_funds_advanced",
        "topics": ["fund_performance", "risk_metrics", "portfolio_analysis"]
    }
]

CHUNK_SIZE = 1000  # characters per chunk
CHUNK_OVERLAP = 200  # overlap between chunks


def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using PyMuPDF"""
    doc = fitz.open(pdf_path)
    full_text = ""
    
    for page_num, page in enumerate(doc):
        text = page.get_text()
        # Add page marker for reference
        full_text += f"\n\n[PAGE {page_num + 1}]\n{text}"
    
    doc.close()
    return full_text


def create_chunks(text, source_info):
    """Split text into overlapping chunks with metadata using sliding window"""
    chunks = []
    
    # Clean text - normalize whitespace
    text = ' '.join(text.split())
    
    # Extract page markers for reference
    page_markers = {}
    import re
    for match in re.finditer(r'\[PAGE (\d+)\]', text):
        page_markers[match.start()] = int(match.group(1))
    
    # Remove page markers from text for cleaner chunks
    clean_text = re.sub(r'\[PAGE \d+\]', '', text)
    
    # Sliding window chunking
    start = 0
    current_page = 1
    chunk_count = 0
    
    while start < len(clean_text):
        # Find current page
        for pos, page in sorted(page_markers.items()):
            if pos <= start:
                current_page = page
        
        # Get chunk
        end = min(start + CHUNK_SIZE, len(clean_text))
        
        # Try to end at sentence boundary
        if end < len(clean_text):
            # Look for sentence end in last 100 chars
            last_period = clean_text[start:end].rfind('. ')
            last_question = clean_text[start:end].rfind('? ')
            sentence_end = max(last_period, last_question)
            if sentence_end > CHUNK_SIZE // 2:
                end = start + sentence_end + 1
        
        chunk_text = clean_text[start:end].strip()
        
        if len(chunk_text) > 100:  # Only keep substantial chunks
            chunk_id = hashlib.md5(f"{source_info['source']}_{chunk_count}_{chunk_text[:50]}".encode()).hexdigest()[:12]
            chunks.append({
                "id": chunk_id,
                "content": chunk_text,
                "source": source_info["source"],
                "category": source_info["category"],
                "page": current_page,
                "topics": source_info["topics"]
            })
            chunk_count += 1
        
        # Move start with overlap
        start = end - CHUNK_OVERLAP
        if start >= len(clean_text) - 100:
            break
    
    return chunks


def get_embedding(text):
    """Get embedding from Gemini API"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={GEMINI_API_KEY}"
    
    data = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{"text": text[:8000]}]  # Limit text size
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            return result.get("embedding", {}).get("values", [])
    except Exception as e:
        print(f"Embedding error: {e}")
        return None


def store_in_supabase(chunks_with_embeddings):
    """Store chunks and embeddings in Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/education_knowledge"
    
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "resolution=merge-duplicates"
    }
    
    # Insert in batches
    batch_size = 20
    for i in range(0, len(chunks_with_embeddings), batch_size):
        batch = chunks_with_embeddings[i:i+batch_size]
        
        records = []
        for chunk in batch:
            records.append({
                "id": chunk["id"],
                "content": chunk["content"],
                "source": chunk["source"],
                "category": chunk["category"],
                "page_number": chunk["page"],
                "topics": chunk["topics"],
                "embedding": chunk["embedding"]
            })
        
        req = urllib.request.Request(
            url,
            data=json.dumps(records).encode(),
            headers=headers,
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                print(f"  Stored batch {i//batch_size + 1}")
        except Exception as e:
            print(f"  Error storing batch: {e}")
    
    return True


def process_documents():
    """Main processing function"""
    all_chunks = []
    
    for doc_info in DOCS:
        pdf_path = PROJECT_ROOT / doc_info["path"]
        
        if not pdf_path.exists():
            print(f"⚠️  File not found: {doc_info['path']}")
            continue
        
        print(f"\n📄 Processing: {doc_info['source']}")
        print(f"   Path: {pdf_path}")
        
        # Extract text
        print("   Extracting text...")
        text = extract_text_from_pdf(str(pdf_path))
        print(f"   Extracted {len(text)} characters")
        
        # Create chunks
        print("   Creating chunks...")
        chunks = create_chunks(text, doc_info)
        print(f"   Created {len(chunks)} chunks")
        
        all_chunks.extend(chunks)
    
    print(f"\n📊 Total chunks: {len(all_chunks)}")
    
    # Generate embeddings
    print("\n🧠 Generating embeddings...")
    chunks_with_embeddings = []
    
    for i, chunk in enumerate(all_chunks):
        if i % 10 == 0:
            print(f"   Progress: {i}/{len(all_chunks)}")
        
        embedding = get_embedding(chunk["content"])
        if embedding:
            chunk["embedding"] = embedding
            chunks_with_embeddings.append(chunk)
    
    print(f"   Generated {len(chunks_with_embeddings)} embeddings")
    
    # Store in Supabase
    print("\n💾 Storing in Supabase...")
    store_in_supabase(chunks_with_embeddings)
    
    # Also save locally as backup
    output_path = Path(__file__).parent / "education_chunks.json"
    with open(output_path, "w") as f:
        # Don't save embeddings locally (too large)
        chunks_no_embed = [{k: v for k, v in c.items() if k != "embedding"} for c in chunks_with_embeddings]
        json.dump(chunks_no_embed, f, indent=2)
    
    print(f"   Saved backup to {output_path}")
    print("\n✅ Done!")


if __name__ == "__main__":
    process_documents()
