
// Usage: node scripts/seed_rag.js
// Prereqs: npm install dotenv @google/generative-ai @supabase/supabase-js

import 'dotenv/config';
import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

// Config
const SUPABASE_URL = "https://inssqicvvbsdpfboazfz.supabase.co"; // Replace if dynamic
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY; // Need Write Role
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_KEY || !SUPABASE_KEY) {
    console.error("Missing Keys in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "embedding-001" });

async function seed() {
    console.log("🌱 Reading Knowledge Base...");

    // Read Rules
    const rawRules = fs.readFileSync('financial_knowledge.json');
    const data = JSON.parse(rawRules);

    console.log(`🤖 Generating Embeddings for ${data.length} items (Rules ONLY)...`);

    for (const item of data) {
        // Embed the CONTENT
        const result = await model.embedContent(item.content);
        const vector = result.embedding.values;

        // Insert
        const { error } = await supabase
            .from('financial_knowledge')
            .insert({
                topic: item.topic,
                content: item.content,
                embedding: vector
            });

        if (error) console.error("Insert Error:", error);
        else console.log(`✅ Included: ${item.topic}`);

        // Rate Limit (Free Tier)
        await new Promise(r => setTimeout(r, 10000));
    }

    console.log("🎉 Seeding Complete!");
}

seed();
