
import handler from '../api/inspector.js';

// Mock Express Request/Response
const req = {
    method: 'POST',
    body: {
        context: {
            persona: 'baburao',
            income: 50000,
            goals: ['Wealth Creation'],
            demographics: { state: 'Maharashtra', os: 'Android' }
        },
        question: "Should I buy a new iPhone?"
    }
};

const res = {
    status: (code) => {
        console.log(`Response Status: ${code}`);
        return res;
    },
    json: (data) => {
        console.log("Response Data:", JSON.stringify(data, null, 2));
        return res;
    }
};

// Run Test
console.log("🧪 Testing Inspector API Handler...");
handler(req, res).catch(err => {
    console.error("💥 Crash:", err);
});
