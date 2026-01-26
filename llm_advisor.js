
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
        const response = await fetch('/api/inspector', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                context,
                question: "Analyze my profile and give me a brutally honest critique in Bollywood style."
            })
        });

        if (response.ok) {
            data = await response.json();
        } else {
            // If server returned an error, try to get the message
            const errorData = await response.json().catch(() => ({}));
            const serverMsg = errorData.error || `Server Error ${response.status}`;

            console.warn("Inspector API failed:", serverMsg);

            // IF it's a 404 (Route not found) or 503 (Server down), THEN fallback
            // But if it's 401 (Missing Key), show the message!
            if (response.status === 401 || response.status === 403) {
                appendMessage("system", "⚠️ API Key Error: " + serverMsg);
                return;
            }

            console.info("Trying client-side fallback...");
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

/* --- EDUCATION RAG: Retrieve from NISM/Varsity knowledge --- */
async function getEducationContext(question) {
    if (!supabaseClient) return null;

    try {
        // First, get embedding for the question
        const embedResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${CONFIG.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'models/text-embedding-004',
                    content: { parts: [{ text: question }] }
                })
            }
        );

        if (!embedResponse.ok) return null;

        const embedData = await embedResponse.json();
        const queryVector = embedData?.embedding?.values;

        if (!queryVector) return null;

        // Search education_knowledge via Supabase RPC
        const { data: results, error } = await supabaseClient.rpc('match_education_content', {
            query_embedding: queryVector,
            match_count: 3,
            category_filter: null
        });

        if (error || !results?.length) return null;

        // Format as educational context
        const educationContext = results.map(r =>
            `📚 [${r.source}, Page ${r.page_number}]:\n${r.content}`
        ).join('\n\n---\n\n');

        return educationContext;

    } catch (e) {
        console.warn('Education RAG error:', e);
        return null;
    }
}

async function runClientSideGemini(context, question) {
    if (!CONFIG.GEMINI_API_KEY) {
        // More helpful error for local development
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const message = isLocal
            ? "Missing API Key. For local testing, run 'vercel dev' or add your key to config.js temporarily (do not commit!)."
            : "Advisor Connection Error. Please ensure GEMINI_API_KEY is set in Vercel settings.";
        throw new Error(message);
    }
    // ... rest of the function ...

    // Use direct REST API instead of SDK for maximum compatibility
    const MODEL = "gemini-2.0-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

    // Retrieve educational context from NISM/Varsity RAG
    let educationBlock = "";
    try {
        const eduContext = await getEducationContext(question);
        if (eduContext) {
            educationBlock = `
            
EDUCATIONAL REFERENCE (from NISM & Varsity - use this to educate the user):
${eduContext}

IMPORTANT: Use the above reference to teach the user something new. Cite the source (e.g., "According to NISM...").
            `;
        }
    } catch (e) {
        console.warn('Education RAG failed:', e);
    }

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
        You are ${char.name} from Bollywood, now a financial EDUCATOR (not advisor).
        STYLE: ${char.style}
        USER PROFILE: ${JSON.stringify(context)}
        QUESTION: ${question}
        ${educationBlock}
        
        YOUR GOAL: EDUCATE the user so they can make their own decisions. 
        - Explain the WHY behind everything
        - Teach concepts, don't just give answers
        - If you have educational reference, cite it (e.g., "NISM says...")
        - Stay in character, mix Hindi/English
        - Keep under 200 words
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
window.getLiveAppRecommendations = getLiveAppRecommendations;

/* --- LIVE APP RECOMMENDATIONS (Gemini with Grounding) --- */
async function getLiveAppRecommendations() {
    const container = document.getElementById('app-cards-container');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div style="grid-column: span 2; text-align:center; padding:40px;">
            <div style="font-size:2rem; margin-bottom:10px;">🔍</div>
            <div style="color:var(--color-text-muted);">Searching for the best apps for YOUR profile...</div>
        </div>
    `;

    // Build user profile parameters
    const personaResult = GLOBAL_STATE.personaResult || {};
    const userVector = personaResult.userVector || [50, 50, 50, 50, 50, 50];
    const gender = GLOBAL_STATE.demographics?.gender || 'not specified';
    const locationType = GLOBAL_STATE.demographics?.locationType || 'metro';
    const goals = GLOBAL_STATE.demographics?.goals || [];
    const persona = GLOBAL_STATE.persona || 'balanced';
    const income = GLOBAL_STATE.income || 50000;

    // Detect OS
    const userAgent = navigator.userAgent || navigator.vendor;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const os = isIOS ? 'iOS' : 'Android';

    // Build the search prompt
    const searchPrompt = `
        Search the web for the TOP 3 best fintech/investment apps in India for this user profile:
        
        USER PROFILE:
        - Gender: ${gender}
        - Location: ${locationType} (${locationType === 'village' ? 'rural area, needs simple UI and vernacular support' : locationType === 'metro' ? 'tech-savvy urban user' : 'semi-urban, moderate tech comfort'})
        - Risk Tolerance: ${userVector[0] > 60 ? 'High (comfortable with volatility)' : userVector[0] < 40 ? 'Low (prefers stability)' : 'Moderate'}
        - Savings Discipline: ${userVector[5] > 50 ? 'Strong' : 'Building'}
        - Monthly Income: ₹${income.toLocaleString()}
        - Goals: ${goals.join(', ') || 'Wealth building'}
        - Platform: ${os}
        
        REQUIREMENTS:
        1. Only suggest SEBI-registered, legitimate apps
        2. For each app, explain WHY it's good for THIS specific user profile
        3. Include: App name, what it does, why it suits this user, and a key learning tip
        4. ${gender === 'female' ? 'Prioritize women-focused platforms like LXME if relevant' : ''}
        5. ${locationType === 'village' ? 'Prefer apps with Hindi/vernacular support and simple UX' : ''}
        
        Format as JSON array:
        [
            {
                "name": "App Name",
                "category": "MF/Stocks/Budget/Gold",
                "why_for_you": "Specific reason for this user",
                "learning_tip": "One finance concept they'll learn using this app",
                "icon": "emoji"
            }
        ]
        
        Return ONLY the JSON array, no other text.
    `;

    try {
        const MODEL = "gemini-2.0-flash";
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: searchPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024
                },
                // Enable grounding with Google Search
                tools: [{
                    googleSearch: {}
                }]
            })
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        let textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Clean the JSON response
        textResponse = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let apps;
        try {
            apps = JSON.parse(textResponse);
        } catch (e) {
            // Fallback to basic recommendations if JSON parse fails
            apps = [
                { name: "Groww", category: "MF", icon: "🌱", why_for_you: "Start with zero-commission mutual funds", learning_tip: "Learn about SIPs - systematic investing" },
                { name: "Zerodha", category: "Stocks", icon: "🪁", why_for_you: "India's largest broker with great learning resources", learning_tip: "Varsity module teaches stock market fundamentals" },
                { name: "Jar", category: "Gold", icon: "🫙", why_for_you: "Build saving habit with round-up gold savings", learning_tip: "Understand digital gold as an asset class" }
            ];
        }

        // Render the live recommendations
        container.innerHTML = apps.slice(0, 3).map((app, index) => `
            <div class="app-card" style="grid-column: span 2; background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:12px; padding:16px; margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                    <div style="font-size:2rem;">${app.icon || '📱'}</div>
                    <div>
                        <div style="font-weight:bold; font-size:1rem;">${app.name}</div>
                        <div style="font-size:0.7rem; color:var(--color-text-muted);">${app.category}</div>
                    </div>
                    <div style="margin-left:auto; background:var(--color-primary); color:white; padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:bold;">
                        #${index + 1} For You
                    </div>
                </div>
                
                <div style="background:rgba(39,174,96,0.1); padding:10px; border-radius:8px; margin-bottom:10px; border-left:3px solid #27ae60;">
                    <div style="font-size:0.7rem; color:#27ae60; font-weight:bold; margin-bottom:4px;">✅ Why this suits YOU:</div>
                    <div style="font-size:0.8rem; color:var(--color-text-main);">${app.why_for_you}</div>
                </div>
                
                <div style="background:rgba(52,152,219,0.1); padding:10px; border-radius:8px; border-left:3px solid #3498db;">
                    <div style="font-size:0.7rem; color:#3498db; font-weight:bold; margin-bottom:4px;">📚 What you'll learn:</div>
                    <div style="font-size:0.8rem; color:var(--color-text-main);">${app.learning_tip}</div>
                </div>
            </div>
        `).join('');

        // Add search timestamp
        container.innerHTML += `
            <div style="grid-column: span 2; text-align:center; font-size:0.6rem; color:var(--color-text-muted); margin-top:10px;">
                🔄 Live search at ${new Date().toLocaleTimeString()} • Powered by Gemini
            </div>
        `;

    } catch (error) {
        console.error('Live search error:', error);
        container.innerHTML = `
            <div style="grid-column: span 2; text-align:center; padding:20px; color:var(--color-text-muted);">
                ⚠️ Couldn't search live. Showing curated suggestions instead.
            </div>
        `;
        // Fallback to static recommendations
        filterApps('top3');
    }
}

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
