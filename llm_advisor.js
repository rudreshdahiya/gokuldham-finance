
// Secure Frontend for Jigri Advisor (Calls /api/inspector)

async function startAdvisorChat(userContext) {
    appendMessage("system", "Namaste! I am connecting to the Jigri HQ...");

    // Auto-trigger an initial analysis
    const context = {
        persona: userContext.persona,
        income: userContext.income,
        allocation: userContext.recommendation || {},
        goals: userContext.demographics.goals,
        demographics: userContext.demographics
    };

    // Trigger Vector Search (in background)
    findPeerInsights(context);


    try {
        // 1. Try Server API
        let data;
        try {
            const response = await fetch('/api/inspector', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context,
                    question: "Analyze my profile and give me a brutally honest critique in Bollywood style."
                })
            });
            if (!response.ok) throw new Error("API Route Failed");
            data = await response.json();
        } catch (apiError) {
            console.warn("Inspector API failed, trying Client-Side...", apiError);
            data = await runClientSideGemini(context, "Analyze my profile and give me a brutally honest critique in Bollywood style.");
        }

        if (data.error) {
            appendMessage("system", "⚠️ Connection Error: " + data.error);
        } else {
            appendMessage("system", data.answer);
        }

    } catch (e) {
        console.error("Advisor Error:", e);
        appendMessage("system", "⚠️ Failed to reach the Advisor. Please try again.");
    }
}

// Trigger App Recommendation Flow
function getAppRecommendations() {
    const input = document.getElementById("chat-input-box");
    // Simulate user typing
    input.value = "Strictly recommend 3 best investment apps for me based on my OS. Prioritize low cost.";
    sendUserMessage();
}


async function runClientSideGemini(context, question) {
    if (!CONFIG.GEMINI_API_KEY) {
        throw new Error("Missing API Key in CONFIG.");
    }

    // Use direct REST API instead of SDK for maximum compatibility
    const MODEL = "gemma-3-27b";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

    // Character-specific prompts (simplified version for client-side)
    const PERSONA_STYLES = {
        baburao: { name: "Baburao", style: "Chaotic landlord. Uses 'Are baba!', 'Khopdi tod!'" },
        raju: { name: "Raju", style: "Street-smart schemer. Uses 'Scheme kya hai?'" },
        shyam: { name: "Shyam", style: "Gentle middle-class. Uses 'Sochna padega'" },
        pushpa: { name: "Pushpa Raj", style: "Intense hustler. Uses 'Jhukega nahi!'" },
        circuit: { name: "Circuit", style: "Loyal sidekick. Uses 'Bhai bole toh...'" },
        munna: { name: "Munna Bhai", style: "Big-hearted tapori. Uses 'Jaadu ki jhappi'" },
        poo: { name: "Poo", style: "Sassy Hinglish queen. Uses 'Tell me how it is!'" },
        chatur: { name: "Chatur", style: "Competitive topper. Uses 'All Izz Well'" },
        raj: { name: "Raj Malhotra", style: "Romantic NRI. Uses 'Bade bade deshon mein...'" },
        bunny: { name: "Bunny", style: "Travel-obsessed. Uses 'Zindagi na milegi dobara'" },
        geet: { name: "Geet", style: "Impulsive. Uses 'Main apni favourite hoon!'" },
        rani: { name: "Rani", style: "Growing confident. Uses 'Ab main khud ki rani hoon'" },
        veeru: { name: "Veeru", style: "Brave gambler. Uses 'Chal Basanti'" },
        rancho: { name: "Rancho", style: "Genius minimalist. Uses 'Aal izz well'" },
        simran: { name: "Simran", style: "Traditional dreamer. Uses 'Papa kehte hain'" },
        farhan: { name: "Farhan", style: "Passion seeker. Uses 'Dil chahta hai'" }
    };

    const persona = context.persona?.toLowerCase() || 'shyam';
    const char = PERSONA_STYLES[persona] || PERSONA_STYLES.shyam;

    const systemPrompt = `
        You are ${char.name} from Bollywood, now a financial advisor.
        STYLE: ${char.style}
        USER: ${JSON.stringify(context)}
        QUESTION: ${question}
        Stay in character, be helpful, mix Hindi/English. Keep under 150 words.
    `;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: systemPrompt }]
            }]
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API Error:", response.status, errorData);
        throw new Error(`Gemini API failed: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";
    return { answer };
}

async function sendUserMessage() {
    const input = document.getElementById("chat-input-box");
    const msg = input.value;
    if (!msg) return;

    appendMessage("user", msg);
    input.value = "";

    // Add loading indicator
    const loadingId = "loading-" + Date.now();
    const history = document.getElementById("chat-history-container");
    history.innerHTML += `<div id="${loadingId}" class="chat-msg system">Typing...</div>`;
    history.scrollTop = history.scrollHeight;

    // Grab Global State for Context
    const context = {
        persona: GLOBAL_STATE.persona,
        income: GLOBAL_STATE.income,
        allocation: GLOBAL_STATE.recommendation || {},
        goals: GLOBAL_STATE.demographics.goals,
        demographics: GLOBAL_STATE.demographics
    };

    try {
        // 1. Try Server API (Production)
        let data;
        try {
            const response = await fetch('/api/inspector', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context, question: msg })
            });
            if (!response.ok) throw new Error("API Failure");
            data = await response.json();
        } catch (apiError) {
            // 2. Fallback to Client Side (Local Testing)
            console.warn("API Failed, switching to Client-Side Gemini:", apiError);
            data = await runClientSideGemini(context, msg);
        }

        document.getElementById(loadingId).remove();

        if (data.error) {
            appendMessage("system", "⚠️ " + data.error);
        } else {
            appendMessage("system", data.answer);
        }

    } catch (e) {
        document.getElementById(loadingId).remove();
        appendMessage("system", "⚠️ Connection failed: " + e.message);
    }
}

function appendMessage(role, text) {
    const history = document.getElementById("chat-history-container");
    const div = document.createElement("div");
    div.className = `chat-msg ${role}`;

    // Simple markdown parser
    let formatted = text || "";
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n/g, '<br>');

    div.innerHTML = formatted;
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

// Expose to window
window.startAdvisorChat = startAdvisorChat;
window.sendUserMessage = sendUserMessage;
window.findPeerInsights = findPeerInsights;

/* --- VECTOR INTELLIGENCE (PEER MATCHING) --- */
async function findPeerInsights(userContext) {
    if (!supabaseClient) return; // Ensure db_client is init

    // 1. Create a "Semantic String" of the user
    // This string represents their financial soul
    const profileText = `
        Persona: ${userContext.persona}.
        Age Group: ${userContext.demographics?.age}.
        State: ${userContext.demographics?.state}.
        Income Level: ${userContext.income > 100000 ? 'High' : 'Mid'}.
        Risk: Equity ${userContext.allocation.equity}%.
    `;

    try {
        // 2. Get Vector from Gemini
        const embedRes = await fetch('/api/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: profileText })
        });
        const embedData = await embedRes.json();

        if (!embedData.vector) return;

        // 3. Search Supabase (RPC call)
        const { data: peers, error } = await supabaseClient.rpc('match_users', {
            query_embedding: embedData.vector,
            match_threshold: 0.7, // 70% similarity
            match_count: 5 // Get top 5 matches
        });

        if (error) throw error;

        if (peers && peers.length > 0) {
            // 4. Analyze Peers
            // Simple Logic: What is the most common goal among peers?
            const allGoals = peers.flatMap(p => p.selected_goals || []);
            const popularGoal = mode(allGoals);

            // UI Update
            appendMessage("system", `
                <strong>👥 Community Insight:</strong><br>
                Found ${peers.length} users financially similar to you.<br>
                Most of them also focused on <em>"${popularGoal || 'Wealth Creation'}"</em>.
            `);

            // Also update the session row with this embedding?
            // Optional: Update current session with vector for future searches.
        }

    } catch (e) {
        console.warn("Peer Insight Failed", e);
    }
}

// Helper: Find most frequent item
function mode(arr) {
    return arr.sort((a, b) =>
        arr.filter(v => v === a).length
        - arr.filter(v => v === b).length
    ).pop();
}
