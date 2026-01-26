#!/usr/bin/env node
/**
 * Fast Education RAG Builder - Node.js version
 * Processes NISM/Varsity PDFs with parallel embedding generation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = "https://inssqicvvbsdpfboazfz.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const PARALLEL_REQUESTS = 5; // Process 5 embeddings at once

// pdf-parse is CommonJS
const pdfParse = require('pdf-parse');

const DOCS = [
    {
        path: 'Module11_Personal-Finance.pdf',
        source: 'Varsity by Zerodha',
        category: 'personal_finance',
        topics: ['budgeting', 'retirement', 'insurance', 'planning']
    },
    {
        path: 'NISM Series V-A Mutual Fund Distributors Certification Examination_November 2025_Final_04-Dec-2025 4 09.pdf',
        source: 'NISM V-A',
        category: 'mutual_funds',
        topics: ['mutual_funds', 'amc', 'nav', 'expense_ratio', 'kyc']
    },
    {
        path: 'NISM SERIES V-B MFF Workbook version-November- 2025 .pdf',
        source: 'NISM V-B',
        category: 'mutual_funds_advanced',
        topics: ['fund_performance', 'risk_metrics', 'portfolio_analysis']
    }
];

function createChunks(text, sourceInfo) {
    const chunks = [];

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    let start = 0;
    let chunkCount = 0;

    while (start < text.length) {
        let end = Math.min(start + CHUNK_SIZE, text.length);

        // Try to end at sentence boundary
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('. ', end);
            const lastQuestion = text.lastIndexOf('? ', end);
            const sentenceEnd = Math.max(lastPeriod, lastQuestion);

            if (sentenceEnd > start + CHUNK_SIZE / 2) {
                end = sentenceEnd + 1;
            }
        }

        const chunkText = text.slice(start, end).trim();

        if (chunkText.length > 100) {
            const chunkId = crypto.createHash('md5')
                .update(`${sourceInfo.source}_${chunkCount}_${chunkText.slice(0, 50)}`)
                .digest('hex')
                .slice(0, 12);

            chunks.push({
                id: chunkId,
                content: chunkText,
                source: sourceInfo.source,
                category: sourceInfo.category,
                page: Math.floor(chunkCount / 2) + 1, // Rough estimate
                topics: sourceInfo.topics
            });

            chunkCount++;
        }

        start = end - CHUNK_OVERLAP;
        if (start >= text.length - 100) break;
    }

    return chunks;
}

async function getEmbedding(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: {
                parts: [{ text: text.slice(0, 8000) }]
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Embedding failed: ${response.status}`);
    }

    const data = await response.json();
    return data?.embedding?.values || null;
}

async function processInBatches(items, batchSize, processor) {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(item => processor(item).catch(e => {
                console.error(`  Error processing item: ${e.message}`);
                return null;
            }))
        );

        results.push(...batchResults.filter(r => r !== null));

        console.log(`  Progress: ${Math.min(i + batchSize, items.length)}/${items.length} (${Math.round(results.length / items.length * 100)}%)`);
    }

    return results;
}

async function storeInSupabase(chunksWithEmbeddings) {
    const url = `${SUPABASE_URL}/rest/v1/education_knowledge`;

    // Store in batches
    const batchSize = 20;
    for (let i = 0; i < chunksWithEmbeddings.length; i += batchSize) {
        const batch = chunksWithEmbeddings.slice(i, i + batchSize);

        const records = batch.map(chunk => ({
            id: chunk.id,
            content: chunk.content,
            source: chunk.source,
            category: chunk.category,
            page_number: chunk.page,
            topics: chunk.topics,
            embedding: chunk.embedding
        }));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(records)
        });

        if (!response.ok) {
            console.error(`  Error storing batch ${i / batchSize + 1}: ${response.status}`);
        } else {
            console.log(`  ✓ Stored batch ${i / batchSize + 1}`);
        }
    }
}

async function main() {
    console.log('🚀 Fast Education RAG Builder\n');

    const allChunks = [];

    // Process each PDF
    for (const docInfo of DOCS) {
        const pdfPath = path.join(__dirname, '..', docInfo.path);

        if (!fs.existsSync(pdfPath)) {
            console.log(`⚠️  Skipping: ${docInfo.path} (not found)`);
            continue;
        }

        console.log(`\n📄 Processing: ${docInfo.source}`);

        // Extract text
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);

        console.log(`   Extracted ${data.text.length} characters from ${data.numpages} pages`);

        // Create chunks
        const chunks = createChunks(data.text, docInfo);
        console.log(`   Created ${chunks.length} chunks`);

        allChunks.push(...chunks);
    }

    console.log(`\n📊 Total chunks: ${allChunks.length}`);

    // Generate embeddings in parallel
    console.log(`\n🧠 Generating embeddings (${PARALLEL_REQUESTS} parallel)...`);

    const chunksWithEmbeddings = await processInBatches(
        allChunks,
        PARALLEL_REQUESTS,
        async (chunk) => {
            const embedding = await getEmbedding(chunk.content);
            return embedding ? { ...chunk, embedding } : null;
        }
    );

    console.log(`   ✓ Generated ${chunksWithEmbeddings.length} embeddings`);

    // Store in Supabase
    console.log(`\n💾 Storing in Supabase...`);
    await storeInSupabase(chunksWithEmbeddings);

    // Save backup
    const outputPath = path.join(__dirname, 'education_chunks.json');
    const chunksNoEmbed = chunksWithEmbeddings.map(({ embedding, ...chunk }) => chunk);
    fs.writeFileSync(outputPath, JSON.stringify(chunksNoEmbed, null, 2));

    console.log(`   ✓ Saved backup to ${outputPath}`);
    console.log(`\n✅ Done! Processed ${chunksWithEmbeddings.length} chunks`);
}

main().catch(console.error);
