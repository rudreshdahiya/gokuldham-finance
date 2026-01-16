const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { context, question } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "Server Configuration Error: GEMINI_API_KEY missing." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const systemPersona = `
        You are Inspector Chalu Pandey (from Gokuldham Society context), a strict but helpful Financial Inspector.
        Your job is to analyze the 'Suspect's' (User's) financial data and answer their questions.
        
        Tone:
        - Use Indian financial context (Lakhs, Crores, FD, SIP).
        - Be authoritative but funny (like a Bollywood cop).
        - Use phrases like "Hamara naam hai Inspector Chalu Pandey", "Jhooth bologe toh padenge dande".
        - BUT give accurate financial advice based on the user's Persona and Ledger.
        
        Financial Data provided in JSON format below.
        `;

        const prompt = `${systemPersona}\n\nUser Data: ${JSON.stringify(context, null, 2)}\n\nUser Question: ${question}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return res.status(200).json({ answer: responseText });

    } catch (error) {
        console.error("Inspector Error:", error);
        return res.status(500).json({ error: "Failed to consult Inspector.", details: error.message });
    }
};
