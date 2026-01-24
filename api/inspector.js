import { createClient } from '@supabase/supabase-js';

// Init Supabase
const supabase = createClient(
    "https://inssqicvvbsdpfboazfz.supabase.co",
    process.env.SUPABASE_KEY || "sb_publishable_2_GInxBEmydd82C3W5aj0A_9_pBTM54"
);

// Model Configuration - Using currently supported models
const CHAT_MODEL = "gemini-2.0-flash";
const EMBED_MODEL = "text-embedding-004";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { context, question } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(401).json({
            error: 'Missing GEMINI_API_KEY in Vercel Environment Variables. Go to Vercel Dashboard > Project Settings > Environment Variables and add GEMINI_API_KEY.'
        });
    }

    try {
        // --- RAG STEP 1: RETRIEVE KNOWLEDGE (Optional) ---
        let infoBlock = "";
        try {
            const queryText = question || `Planning for ${context.persona}`;

            // Get embedding using REST API
            const embedResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: `models/${EMBED_MODEL}`,
                        content: { parts: [{ text: queryText }] }
                    })
                }
            );

            if (embedResponse.ok) {
                const embedData = await embedResponse.json();
                const vector = embedData?.embedding?.values;

                if (vector) {
                    // Search DB
                    const { data: rules } = await supabase.rpc('match_knowledge', {
                        query_embedding: vector,
                        match_threshold: 0.6,
                        match_count: 3
                    });

                    if (rules && rules.length > 0) {
                        infoBlock = "EXPERT GUIDELINES (Strictly follow these):\n" +
                            rules.map(r => `- ${r.content}`).join("\n");
                    }
                }
            }
        } catch (e) {
            console.warn("RAG Retrieval Failed:", e.message);
            // Continue without RAG
        }

        // --- DYNAMIC PERSONA PROMPT ---
        const userPersona = context.persona || "shyam";
        let advisorPersona = "Jigri Advisor";
        let vibe = "Friendly and Professional";

        if (["baburao", "raju", "shyam"].includes(userPersona.toLowerCase())) {
            advisorPersona = "Baburao Style";
            vibe = "Chaotic, funny, frantic, using slang like 'Are baba!', 'Khopdi tod!', 'Paisa hi paisa hoga!'";
        } else if (["pushpa", "circuit", "munna"].includes(userPersona.toLowerCase())) {
            advisorPersona = "Bhai Style";
            vibe = "Tapori, bold, confident, calling user 'Bhai' or 'Biddu'.";
        } else if (["poo", "chatur", "raj"].includes(userPersona.toLowerCase())) {
            advisorPersona = "High Society";
            vibe = "Sassy, using Hinglish, maybe a bit snobbish but helpful.";
        }

        const systemPrompt = `
        You are acting as: ${advisorPersona}.
        VIBE: ${vibe}
        
        CONTEXT:
        The user is identified as: '${userPersona.toUpperCase()}'.
        
        ${infoBlock}
        
        USER PROFILE:
        - Income: ₹${context.income || 0}
        - Goals: ${JSON.stringify(context.goals || [])}
        - State: ${context.demographics?.state || "India"}
        - Device OS: ${context.demographics?.os || "Unknown"}

        THEIR PLAN:
        ${JSON.stringify(context.allocation || {})}

        User Question: "${question}"

        TASK:
        1. If asked about APPS/PLATFORMS:
           - Recommend specifically 3 apps based on their OS (${context.demographics?.os || "Unknown"}).
           - Prioritize: Low Cost > Trust > Latest Tech.
           - Give a reason for each (e.g., "Best for iOS", "Cheapest for MFs").
        2. Otherwise:
           - Answer the financial question using the EXPERT GUIDELINES above if available.
           - Be helpful and specific.
        
        IMPORTANT: Speak EXACTLY like ${advisorPersona}. Be funny but helpful.
        Keep response under 200 words.
        `;

        // --- GENERATE WITH REST API ---
        const chatResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: {
                        maxOutputTokens: 500,
                        temperature: 0.8
                    }
                })
            }
        );

        if (!chatResponse.ok) {
            const errorData = await chatResponse.json().catch(() => ({}));
            console.error("Gemini API Error:", chatResponse.status, errorData);
            return res.status(500).json({
                error: `Gemini API failed: ${errorData?.error?.message || chatResponse.statusText}`
            });
        }

        const chatData = await chatResponse.json();
        const answer = chatData?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";

        return res.status(200).json({ answer });

    } catch (error) {
        console.error("Handler Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
