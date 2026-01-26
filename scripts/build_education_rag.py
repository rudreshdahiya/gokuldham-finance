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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = "https://inssqicvvbsdpfboazfz.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Document paths (in project root, not scripts folder)
PROJECT_ROOT = Path(__file__).parent.parent

DOCS = [
    {
        "source": "NISM Series V-A (Mutual Fund Distributors)",
        "path": "NISM Series V-A Mutual Fund Distributors Certification Examination_November 2025_Final_04-Dec-2025 4 09.pdf",
        "category": "Mutual Funds",
        "topics": ["Regulation", "Structure", "Selection"]
    },
    {
        "source": "NISM SERIES V-B Mutual Fund Foundation",
        "path": "NISM SERIES V-B MFF Workbook version-November- 2025 .pdf",
        "category": "Mutual Funds",
        "topics": ["fund_performance", "risk_metrics", "portfolio_analysis"]
    },
    {
        "source": "Zerodha Varsity (Personal Finance)",
        "path": "Module11_Personal-Finance.pdf",
        "category": "Financial Planning",
        "topics": ["Risk", "Goal Planning", "Equity", "Debt"]
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
    
    # Clean text - normalize whitespace but keep some structure
    import re
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Extract page markers for reference BEFORE they get split
    page_markers = {}
    for match in re.finditer(r'\[PAGE (\d+)\]', text):
        page_markers[match.start()] = int(match.group(1))
    
    # Remove page markers from text for cleaner chunks
    clean_text = re.sub(r'\[PAGE \d+\]', '', text)
    
    print(f"   Clean text length: {len(clean_text)} characters")
    
    # Sliding window chunking
    start = 0
    chunk_count = 0
    
    while start < len(clean_text):
        # Find current page
        current_page = 1
        for pos, page in sorted(page_markers.items()):
            if pos <= start:
                current_page = page
            else:
                break
        
        # Get chunk
        end = min(start + CHUNK_SIZE, len(clean_text))
        
        # Try to end at sentence boundary
        if end < len(clean_text):
            # Look for sentence end in last 200 chars to be more flexible
            search_area = clean_text[start:end]
            last_period = search_area.rfind('. ')
            last_question = search_area.rfind('? ')
            sentence_end = max(last_period, last_question)
            
            if sentence_end > CHUNK_SIZE // 2:
                end = start + sentence_end + 1
        
        chunk_text = clean_text[start:end].strip()
        
        if len(chunk_text) > 100:  # Only keep substantial chunks
            chunk_id = hashlib.md5(f"{source_info['source']}_{chunk_count}_{chunk_text[:30]}".encode()).hexdigest()[:12]
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
        start_step = end - start - CHUNK_OVERLAP
        if start_step <= 0:  # Ensure we always move forward
            start_step = CHUNK_SIZE // 2
            
        start += start_step
        
        if start >= len(clean_text) - 50:
            break
    
    return chunks


def get_embedding(text):
    """Get embedding from Gemini API"""
    import ssl
    context = ssl._create_unverified_context()
    
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
        with urllib.request.urlopen(req, context=context) as response:
            result = json.loads(response.read().decode())
            return result.get("embedding", {}).get("values", [])
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"Embedding API Error {e.code}: {error_body}")
        return None
    except Exception as e:
        print(f"Embedding error: {e}")
        return None


def store_in_supabase(chunks_with_embeddings):
    """Store chunks and embeddings in Supabase"""
    import ssl
    context = ssl._create_unverified_context()
    
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
            with urllib.request.urlopen(req, context=context) as response:
                print(f"  Stored batch {i//batch_size + 1}")
        except Exception as e:
            print(f"  Error storing batch: {e}")
            
        # Small delay between batches
        import time
        time.sleep(0.1)
    
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
    
    # Generate embeddings with caching
    print("\n🧠 Generating embeddings (with local caching)...")
    chunks_with_embeddings = []
    cache_path = Path(__file__).parent / "education_embeddings_cache.json"
    
    # Load cache if exists
    cache = {}
    if cache_path.exists():
        try:
            with open(cache_path, "r") as f:
                cache = json.load(f)
            print(f"   Loaded {len(cache)} embeddings from cache.")
        except:
            print("   Cache file corrupted, starting fresh.")

    for i, chunk in enumerate(all_chunks):
        if i % 20 == 0:
            print(f"   Progress: {i}/{len(all_chunks)}")
        
        # Use simple ID or hash of content as cache key
        cache_key = chunk["id"]
        
        if cache_key in cache:
            chunk["embedding"] = cache[cache_key]
        else:
            embedding = get_embedding(chunk["content"])
            if embedding:
                chunk["embedding"] = embedding
                cache[cache_key] = embedding
                # Save cache every 50 embeddings to avoid total loss on crash
                if len(cache) % 50 == 0:
                    with open(cache_path, "w") as f:
                        json.dump(cache, f)
            else:
                continue
        
        chunks_with_embeddings.append(chunk)

    # Final cache save
    with open(cache_path, "w") as f:
        json.dump(cache, f)
    
    print(f"   Generated/Loaded {len(chunks_with_embeddings)} embeddings")
    
    # Store in Supabase
    print("\n💾 Storing in Supabase...")
    success = store_in_supabase(chunks_with_embeddings)
    
    if success:
        print("\n✅ Upload Complete!")
    else:
        print("\n⚠️  Upload failed, but embeddings are saved in cache. run again to retry.")

    # Also save metadata locally (no embeddings)
    output_path = Path(__file__).parent / "education_chunks.json"
    chunks_no_embed = [{k: v for k, v in c.items() if k != "embedding"} for c in chunks_with_embeddings]
    with open(output_path, "w") as f:
        json.dump(chunks_no_embed, f, indent=2)
    
    print(f"   Saved metadata backup to {output_path}")


if __name__ == "__main__":
    process_documents()
