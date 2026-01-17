// Vercel Serverless Function - Inspector Chat Proxy
// Keeps API keys secure, never sleeps!

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { context, question } = req.body;

        // Call Gemini API directly (keep API key in Vercel env)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                answer: "⚠️ API key not configured. Add GEMINI_API_KEY to Vercel environment variables."
            });
        }

        const prompt = `You are Inspector Pandey, a friendly financial advisor for Gokuldham Society members.

User Context:
- Persona: ${context.persona || 'Unknown'}
- Income: ₹${context.income || 0}
- Goals: ${context.goals?.join(', ') || 'None'}
- Allocation: ${JSON.stringify(context.allocation || {})}

Question: ${question}

Provide a helpful, personalized answer in 2-3 sentences. Be warm and reference their persona if relevant.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            }
        );

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]) {
            throw new Error('No response from Gemini');
        }

        const answer = data.candidates[0].content.parts[0].text;

        return res.status(200).json({ answer });

    } catch (error) {
        console.error('Inspector error:', error);
        return res.status(500).json({
            answer: "Sorry, I'm having trouble connecting right now. Please try again in a moment."
        });
    }
}
