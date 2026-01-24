
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
        const response = await fetch('/api/inspector', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                context: context,
                question: "Analyze my profile and give me a brutally honest critique in Bollywood style."
            })
        });

        const data = await response.json();

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
        const response = await fetch('/api/inspector', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                context: context,
                question: msg
            })
        });

        const data = await response.json();
        document.getElementById(loadingId).remove();

        if (data.error) {
            appendMessage("system", "⚠️ " + data.error);
        } else {
            appendMessage("system", data.answer);
        }

    } catch (e) {
        document.getElementById(loadingId).remove();
        appendMessage("system", "⚠️ Connection failed.");
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
