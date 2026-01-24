
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "embedding-001" });

        const result = await model.embedContent(text);
        const embedding = result.embedding;
        const vector = embedding.values;

        return res.status(200).json({ vector: vector });

    } catch (error) {
        console.error("Embedding Error:", error);
        return res.status(500).json({ error: 'Embedding Failed', details: error.message });
    }
}
