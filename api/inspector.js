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
            console.error('GEMINI_API_KEY not found in environment');
            return res.status(500).json({
                answer: "⚠️ API key not configured. Add GEMINI_API_KEY to Vercel environment variables."
            });
        }

        const prompt = `You are Inspector Pandey, a friendly financial advisor for Gokuldham Society members.

User Context:
- Persona: ${context?.persona || 'Unknown'}
- Income: ₹${context?.income || 0}
- Goals: ${context?.goals?.join(', ') || 'None'}
- Allocation: ${JSON.stringify(context?.allocation || {})}

Question: ${question || 'No question provided'}

Provide a helpful, personalized answer in 2-3 sentences. Be warm and reference their persona if relevant.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

        // Check for API errors
        if (data.error) {
            console.error('Gemini API error:', data.error);
            return res.status(500).json({
                answer: `API Error: ${data.error.message || 'Unknown error from Gemini'}`
            });
        }

        if (!data.candidates || !data.candidates[0]) {
            console.error('No candidates in response:', JSON.stringify(data));
            return res.status(500).json({
                answer: "No response generated. The model may have blocked this request."
            });
        }

        const answer = data.candidates[0].content?.parts?.[0]?.text || "I couldn't generate a response.";

        return res.status(200).json({ answer });

    } catch (error) {
        console.error('Inspector error:', error.message, error.stack);
        return res.status(500).json({
            answer: `Error: ${error.message}. Please try again.`
        });
    }
}
