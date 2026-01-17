// ==========================================
// SPEND-TREK 2.0: LOGIC ENGINE (V12.0 - The 6-Page Flow)
// ==========================================

// --- STATE MANAGEMENT ---
let GLOBAL_STATE = {
    income: 0,
    alloc: { needs: 50, wants: 30, savings: 20 },
    persona: null,
    demographics: { age: "29-39", state: "maharashtra", goals: [] },
    recommendation: null
};

// ==========================================
// 1. NAVIGATION & INITIALIZATION
// ==========================================

function initUI() {
    console.log("🚀 Initializing Google Bank UI...");

    // Check for previous session? (Optional: Restore from local storage)
    // For MVP, start fresh or Page 1.
    goToPage(1);

    // Populate Dynamic Dropdowns (States)
    populateStates();
}

function goToPage(pageNum) {
    // Hide all pages
    document.querySelectorAll('.ui-screen').forEach(el => el.classList.add('hidden'));

    // Show target page
    const target = document.getElementById(`ui-page-${pageNum}`);
    if (target) target.classList.remove('hidden');

    // Special Inits per Page
    if (pageNum === 2) updateLedger(); // Init Sliders
    if (pageNum === 4) updateGoals(); // Init Goals
}

// ==========================================
// 2. PAGE 2: UPI RECEIPT (INPUTS)
// ==========================================

function updateLedger(changedId) {
    // 1. Get Income
    GLOBAL_STATE.income = parseFloat(document.getElementById("input-income").value) || 0;

    // 2. Handle Sliders (Auto-balance to 100%)
    let needs = parseInt(document.getElementById("slider-needs").value);
    let wants = parseInt(document.getElementById("slider-wants").value);
    let savings = parseInt(document.getElementById("slider-savings").value);

    // Simple Locker: Only modify the one NOT dragged if possible? 
    // For MVP simplicity: Just display error if not 100 on "Submit", or try to smart-adjust.
    // Let's rely on the "Total Check" visual for user.

    let total = needs + wants + savings;
    const checkEl = document.getElementById("total-check");

    if (total === 100) {
        checkEl.style.background = "#d4edda";
        checkEl.style.color = "#155724";
        checkEl.innerText = "Total: 100% (Perfect)";
    } else {
        checkEl.style.background = "#f8d7da";
        checkEl.style.color = "#721c24";
        checkEl.innerText = `Total: ${total}% (Target: 100%)`;
    }

    // Update Text Labels
    document.getElementById("val-needs").innerText = needs + "%";
    document.getElementById("val-wants").innerText = wants + "%";
    document.getElementById("val-savings").innerText = savings + "%";

    GLOBAL_STATE.alloc = { needs, wants, savings };
}

function analyzeHabits() {
    // 1. Validate
    const total = GLOBAL_STATE.alloc.needs + GLOBAL_STATE.alloc.wants + GLOBAL_STATE.alloc.savings;
    if (total !== 100) {
        alert("Please ensure sliders add up to exactly 100%.");
        return;
    }
    if (GLOBAL_STATE.income < 1000) {
        alert("Please enter a valid monthly income.");
        return;
    }

    // 2. Call K-means (Simulated or Real)
    // We use the LOCAL FORENSICS ENGINE or API if available.
    // For MVP Speed, let's use the local logic first, then async fetch backend if needed.

    console.log("Analyzing Habits...", GLOBAL_STATE.alloc);

    // Simulate API Call delay
    document.getElementById("total-check").innerText = "Analyzing Transaction Patterns...";

    setTimeout(() => {
        // --- LOGIC STEP A: DETERMINE PERSONA ---
        // We use the existing forensics logic but purely on Needs/Wants/Savings
        // Mocking the inputs required by determinePersona
        const personaRes = FORENSICS_ENGINE.determinePersona(
            window.DATA_ENGINE,
            "maharashtra", // Placeholder state (doesn't affect persona cluster much, mostly spending)
            "29-39",       // Placeholder age
            GLOBAL_STATE.alloc.needs,
            GLOBAL_STATE.alloc.wants,
            GLOBAL_STATE.alloc.savings,
            [], // No goals yet
            {}, // No granular yet
            0   // No debt input yet
        );

        GLOBAL_STATE.persona = personaRes.key;
        console.log("Persona Detected:", GLOBAL_STATE.persona);

        // 3. Render Page 3
        renderPersonaPage(GLOBAL_STATE.persona, personaRes.clusterId || "#C16");
        goToPage(3);
    }, 800);
}

// ==========================================
// 3. PAGE 3: PERSONA REVEAL
// ==========================================

function renderPersonaPage(personaKey, clusterId) {
    const pData = DATA_ENGINE.PERSONAS[personaKey] || DATA_ENGINE.PERSONAS['mehta'];

    document.getElementById("persona-name").innerText = pData.name.toUpperCase();
    document.getElementById("persona-desc").innerText = pData.quote;
    document.getElementById("persona-cluster").innerText = clusterId || "CLUSTER-X";

    // Image
    const container = document.getElementById("persona-image-container");
    container.innerHTML = `<img src="${pData.img}" style="width:150px; height:150px; border-radius:50%; border:4px solid #fff; box-shadow:0 0 20px rgba(255,215,0,0.5);">`;
}

// ==========================================
// 4. PAGE 4: CONTEXT (DEMOGRAPHICS)
// ==========================================

function updateGoals() {
    const age = document.getElementById("input-age").value;
    const container = document.getElementById("goal-pills-container");
    container.innerHTML = "";

    // Reuse existing logic map
    let ageKey = "18-25";
    if (["22-28", "29-39"].includes(age)) ageKey = "26-42";
    if (["40-60", "60+"].includes(age)) ageKey = "43-58";

    // Use DATA_ENGINE
    const goalIds = DATA_ENGINE.GOALS_BY_AGE[ageKey] || DATA_ENGINE.GOALS_BY_AGE["18-25"];

    goalIds.slice(0, 6).forEach(id => { // Limit to 6 for mobile UI
        const goal = DATA_ENGINE.ALL_GOALS[id];
        const pill = document.createElement("div");
        pill.className = "goal-pill";
        pill.innerText = goal.label;
        pill.onclick = () => {
            pill.classList.toggle("active");
            // Limit 2
            const active = document.querySelectorAll(".goal-pill.active");
            if (active.length > 2) {
                pill.classList.remove("active");
                alert("Please select top 2 goals only.");
            }
        };
        container.appendChild(pill);
    });
}

function generateStrategy() {
    // 1. Capture Inputs
    GLOBAL_STATE.demographics.age = document.getElementById("input-age").value;
    GLOBAL_STATE.demographics.state = document.getElementById("input-state").value;

    const activePills = document.querySelectorAll(".goal-pill.active");
    if (activePills.length === 0) {
        alert("Please select at least 1 goal.");
        return;
    }

    GLOBAL_STATE.demographics.goals = Array.from(activePills).map(p => p.innerText);

    // 2. LOGIC STEP B: GENERATE RECOMMENDATION
    // Call Python Backend (Optimization) or Fallback to Rule Engine

    console.log("Generating Strategy...", GLOBAL_STATE);
    goToPage(5); // Show Page 5 immediately with Loading States

    // Trigger Async Loaders
    runAssetAllocationEngine();
    runTaxOptimizer();
}

// ==========================================
// 5. DOCUMENT LOADING (STYLES & LISTENERS)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initUI();
});

// Helper: Populate States (copied from old logic but simplified)
function populateStates() {
    const select = document.getElementById('input-state');
    if (!select) return;

    FALLBACK_STATES.forEach(state => {
        const option = document.createElement("option");
        option.value = state;
        option.innerText = state.replace(/-/g, ' ').toUpperCase();
        select.appendChild(option);
    });
}

// ==========================================
// 6. STRATEGY ENGINE (PAGE 5 & 6)
// ==========================================

function runAssetAllocationEngine() {
    // 1. Prepare Payload
    // If we have AI persona, we use it. Else rule-based.
    // For MVP, valid inputs: Age, Income, Risk (derived from Persona).

    // Heuristic Risk Score
    let risk = 2; // Moderate
    const pKey = GLOBAL_STATE.persona || "mehta";
    if (["jethalal", "babita", "roshan", "daya", "tapu"].includes(pKey)) risk = 3;
    if (["bhide", "popatlal", "champaklal", "abdul"].includes(pKey)) risk = 1;

    // Call Backend
    const presPayload = {
        age: parseInt(GLOBAL_STATE.demographics.age.split("-")[0]) || 30,
        income: GLOBAL_STATE.income,
        horizon_years: 10, // Default for now, or calc from goals
        risk_tolerance: risk
    };

    console.log("Calling Prescription Engine...", presPayload);

    // Fallback Mock in case backend is sleeping (common on Render free tier)
    const mockPrescription = {
        equity: 50, debt: 30, gold: 20,
        confidence: "High",
        reco: "Balanced Growth Strategy"
    };

    fetch("https://gokuldham-backend.onrender.com/analyze/prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presPayload)
    })
        .then(res => res.json())
        .then(data => {
            GLOBAL_STATE.recommendation = data;
            renderAllocationChart(data);
            renderRebalancing(data);
        })
        .catch(e => {
            console.warn("Backend API Failed, using Mock.", e);
            GLOBAL_STATE.recommendation = mockPrescription;
            renderAllocationChart(mockPrescription);
            renderRebalancing(mockPrescription);
        });
}

function renderAllocationChart(data) {
    const ctx = document.getElementById('allocationChart').getContext('2d');

    // Destroy old if exists
    if (window.allocChartInstance) window.allocChartInstance.destroy();

    window.allocChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Equity (Growth)', 'Debt (Safety)', 'Gold (Hedge)'],
            datasets: [{
                data: [data.equity, data.debt, data.gold],
                backgroundColor: ['#2ecc71', '#3498db', '#f1c40f'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#333' } }
            }
        }
    });

    // Details Text
    const details = document.getElementById("allocation-details");
    details.innerHTML = `
        <div class="allocation-item">
            <span><strong>Equity</strong> (Nifty 50/Midcap)</span>
            <span>${data.equity}%</span>
        </div>
        <div class="allocation-item">
            <span><strong>Debt</strong> (PPF/Bonds)</span>
            <span>${data.debt}%</span>
        </div>
        <div class="allocation-item">
            <span><strong>Gold</strong> (SGB/Digital)</span>
            <span>${data.gold}%</span>
        </div>
        <p style="font-size:0.9em; color:#666; margin-top:10px; font-style:italic;">
            Strategy: "${data.reco || "AI Generated"}"
        </p>
    `;
}

function runTaxOptimizer() {
    // Call Python Linear Solver
    const payload = {
        investment_amount: GLOBAL_STATE.income * 0.2 * 12, // Approx annual savings
        risk_profile: 2
    };

    const container = document.getElementById("tax-strategy-content");

    fetch("https://gokuldham-backend.onrender.com/analyze/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            let html = `<div style="margin-bottom:10px; color:#27ae60; font-weight:bold;">${data.message}</div>`;

            // Loop allocation
            for (const [key, val] of Object.entries(data.allocation)) {
                if (val && val !== "₹0") {
                    html += `
                    <div class="tax-row">
                        <span>${key}</span>
                        <span>${val}</span>
                    </div>
                 `;
                }
            }

            html += `<div style="font-size:0.8em; color:#888; margin-top:5px;">Projected 1Y Yield: ₹${data.projected_return_1y}</div>`;
            container.innerHTML = html;
        })
        .catch(e => {
            container.innerHTML = `<div style="color:red">Tax Engine unavailable. Consult CA.</div>`;
        });
}

function renderRebalancing(data) {
    const container = document.getElementById("rebalancing-content");
    container.innerHTML = `
        <p>Your portfolio drifts with market volatility. Review every <strong>6 months</strong> or when deviation > 5%.</p>
        <div class="tax-row" style="background:#fff3e0; border-left:4px solid #f39c12;">
            <span>Next Review Date</span>
            <span>${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
        </div>
    `;
}

// ==========================================
// 7. AI COMPANION (CHAT) - PAGE 6
// ==========================================

function sendMessage() {
    const input = document.getElementById("chat-input");
    const msg = input.value;
    if (!msg) return;

    // UI Add User Msg
    const history = document.getElementById("chat-history");
    history.innerHTML += `<div class="chat-msg user">${msg}</div>`;
    input.value = "";

    // Add Loading
    const loadingId = "load-" + Date.now();
    history.innerHTML += `<div id="${loadingId}" class="chat-msg system">Typing...</div>`;
    history.scrollTop = history.scrollHeight;

    // Context Construction
    const context = {
        persona: GLOBAL_STATE.persona || "Unknown",
        income: GLOBAL_STATE.income,
        allocation: GLOBAL_STATE.recommendation || {},
        goals: GLOBAL_STATE.demographics.goals,
        question: msg
    };

    fetch("/api/inspector", { // Hits Vercel Function which hits Gemini
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            context: context,
            question: msg
        })
    })
        .then(res => res.json())
        .then(data => {
            document.getElementById(loadingId).remove();
            // Format MD
            let cleanAnswer = data.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            history.innerHTML += `<div class="chat-msg system">${cleanAnswer}</div>`;
            history.scrollTop = history.scrollHeight;
        })
        .catch(e => {
            document.getElementById(loadingId).innerText = "Error contacting Inspector Pandey.";
        });
}
