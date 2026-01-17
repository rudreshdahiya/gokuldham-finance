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

// ==========================================
// 2. PAGE 2: UPI RECEIPT (INPUTS) - GRANULAR V13
// ==========================================

// Granular State Map
let GRANULAR_ALLOC = {
    housing: 30, utilities: 20, // Needs
    dining: 10, travel: 10, shopping: 10, // Wants
    invest: 20 // Savings
};

function updateLedger(changedId, categoryKey) {
    // 1. Get Income
    GLOBAL_STATE.income = parseFloat(document.getElementById("input-income").value) || 0;

    // 2. Update State from Input
    if (changedId && categoryKey) {
        const val = parseInt(document.getElementById(changedId).value);
        GRANULAR_ALLOC[categoryKey] = val;
        // Update Label
        document.getElementById(`val-${categoryKey}`).innerText = val + "%";
    }

    // 3. Calculate Totals
    let total = 0;
    for (let key in GRANULAR_ALLOC) total += GRANULAR_ALLOC[key];

    // 4. Smart Cap Visualization (Max 100 Logic)
    // We don't block the slider movement (UX friction), but we show the overflow visually.
    // User requested "Intuitive... don't allow above 100".
    // Strict Mode: If total > 100, we clamp the CHANGED slider back?

    if (total > 100 && changedId) {
        // Revert Operation?
        // It's better to clamp the input value to (100 - (total - current))
        const pVal = GRANULAR_ALLOC[categoryKey];
        const overflow = total - 100;
        const correctVal = pVal - overflow;

        if (correctVal >= 0) {
            document.getElementById(changedId).value = correctVal;
            GRANULAR_ALLOC[categoryKey] = correctVal;
            document.getElementById(`val-${categoryKey}`).innerText = correctVal + "%";
            total = 100;
        }
    }

    // 5. Update Footer UI
    const checkEl = document.getElementById("total-check");
    const barFill = document.getElementById("budget-bar-fill");

    barFill.style.width = total + "%";

    if (total === 100) {
        checkEl.style.color = "#2ecc71"; // Green
        checkEl.innerText = "✓ Perfect Balance (100%)";
        barFill.style.background = "#2ecc71";
    } else if (total < 100) {
        checkEl.style.color = "#f1c40f"; // Yellow
        checkEl.innerText = `${100 - total}% Remaining for Allocation`;
        barFill.style.background = "#f1c40f";
    } else {
        // Should catch above, but strictly:
        checkEl.style.color = "#e74c3c"; // Red
        checkEl.innerText = `Overload! Reduce by ${total - 100}%`;
        barFill.style.background = "#e74c3c";
    }

    // 6. Map to Global State (N/W/S) for Compability
    GLOBAL_STATE.alloc.needs = GRANULAR_ALLOC.housing + GRANULAR_ALLOC.utilities;
    GLOBAL_STATE.alloc.wants = GRANULAR_ALLOC.dining + GRANULAR_ALLOC.travel + GRANULAR_ALLOC.shopping;
    GLOBAL_STATE.alloc.savings = GRANULAR_ALLOC.invest;
}

function analyzeHabits() {
    // 1. Validate
    const total = Object.values(GRANULAR_ALLOC).reduce((a, b) => a + b, 0);

    if (total !== 100) {
        alert(`Please allocate exactly 100%. (Current: ${total}%)`);
        return;
    }

    if (GLOBAL_STATE.income < 1000) {
        alert("Please enter a valid monthly income.");
        return;
    }

    // 2. K-Means
    console.log("Analyzing Granular Habits...", GRANULAR_ALLOC);
    document.getElementById("total-check").innerText = "Analyzing Transaction Patterns...";

    setTimeout(() => {
        // Pass granular stats to forensics (if simplified, just pass N/W/S)
        const personaRes = FORENSICS_ENGINE.determinePersona(
            window.DATA_ENGINE,
            "maharashtra",
            "29-39",
            GLOBAL_STATE.alloc.needs,
            GLOBAL_STATE.alloc.wants,
            GLOBAL_STATE.alloc.savings,
            [],
            GRANULAR_ALLOC, // Pass granular object for future V2 logic
            0
        );

        GLOBAL_STATE.persona = personaRes.key;
        renderPersonaPage(GLOBAL_STATE.persona, personaRes.clusterId || "#C16");
        goToPage(3);
    }, 800);
}

// ==========================================
// 3. PAGE 3: PERSONA REVEAL
// ==========================================

const PERSONA_TRIBES = {
    "jethalal": ["abdul", "bagha"], "abdul": ["jethalal", "bagha"], // Strugglers
    "babita": ["roshan", "daya"], "roshan": ["babita", "tapu"], "daya": ["babita", "anjali"], "tapu": ["roshan", "babita"], "komal": ["roshan", "daya"], "anjali": ["daya", "babita"], // Spenders
    "bhide": ["popatlal", "madhavi"], "popatlal": ["bhide", "champaklal"], "madhavi": ["bhide", "sodhi"], "iyer": ["sodhi", "bhide"], "sodhi": ["iyer", "madhavi"], "champaklal": ["popatlal", "bhide"], // Savers
    "mehta": ["iyer", "bhide"], "bagha": ["jethalal", "popatlal"] // Balanced
};

function renderPersonaPage(personaKey, clusterId) {
    const pData = DATA_ENGINE.PERSONAS[personaKey] || DATA_ENGINE.PERSONAS['mehta'];

    // 1. Basic Info
    document.getElementById("persona-name").innerText = pData.name.toUpperCase();
    document.getElementById("persona-desc").innerText = pData.quote;

    // 2. Image
    const container = document.getElementById("persona-image-container");
    const imgPath = pData.img || "assets/mehta.png";
    container.innerHTML = `<img src="${imgPath}" alt="${pData.name}" onerror="this.src='assets/mehta.png'">`;

    // 3. WHY? (Reasoning)
    // We get this from the last entry of the logic log, or generate a generic one.
    // GLOBAL_STATE.personaData contains { key, log, effectiveSavings }
    let reason = "Your spending habits match this profile.";
    if (GLOBAL_STATE.personaData && GLOBAL_STATE.personaData.log && GLOBAL_STATE.personaData.log.length > 0) {
        reason = GLOBAL_STATE.personaData.log[GLOBAL_STATE.personaData.log.length - 1];
        // Clean up the log string for display
        reason = reason.split("->")[0].trim(); // Take the part before "->"
    }

    const statContainer = document.querySelector(".persona-stat");
    statContainer.innerHTML = `
        <div style="margin-bottom:15px;">
            <div style="font-size:0.7rem; font-weight:bold; color:var(--color-primary); letter-spacing:1px; margin-bottom:5px;">WHY THIS MATCH?</div>
            <div style="font-family:var(--font-mono); font-size:0.85rem; color:#333;">"${reason}"</div>
        </div>
    `;

    // 4. NEIGHBORS
    const neighbors = PERSONA_TRIBES[personaKey] || ["mehta", "bhide"];
    let neighborsHtml = `<div style="display:flex; justify-content:center; gap:15px; margin-top:10px;">`;

    neighbors.forEach(nKey => {
        const nData = DATA_ENGINE.PERSONAS[nKey];
        if (nData) {
            neighborsHtml += `
            <div style="text-align:center; opacity:0.6;">
                <img src="${nData.img}" style="width:40px; height:40px; border-radius:50%; border:2px solid #ddd;">
                <div style="font-size:0.6rem; margin-top:3px; font-weight:bold;">${nData.name}</div>
            </div>`;
        }
    });
    neighborsHtml += `</div>`;

    statContainer.innerHTML += `
        <div style="border-top:1px dashed #ddd; margin-top:15px; padding-top:15px;">
             <div style="font-size:0.7rem; font-weight:bold; color:#888; letter-spacing:1px; margin-bottom:10px;">CLOSEST MATCHES</div>
             ${neighborsHtml}
        </div>
    `;
}

// ==========================================
// 4. PAGE 4: CONTEXT (DEMOGRAPHICS)
// ==========================================

// Helper: Populate States
function populateStates() {
    const select = document.getElementById('input-state');
    if (!select) return;

    // Use DATA_ENGINE source of truth
    const states = window.DATA_ENGINE ? window.DATA_ENGINE.ALL_STATES : [];

    // Clear and Add Placeholder
    select.innerHTML = `<option value="" disabled selected>-- Select Your State --</option>`;

    states.forEach(state => {
        const option = document.createElement("option");
        option.value = state;
        option.innerText = state.replace(/-/g, ' ').toUpperCase();
        select.appendChild(option);
    });
}

function updateStateContext() {
    const state = document.getElementById("input-state").value;
    const contextDiv = document.getElementById("state-context-display");

    if (!state || !DATA_ENGINE.STATE_MULTIPLIERS[state]) {
        contextDiv.style.display = "none";
        return;
    }

    const mul = DATA_ENGINE.STATE_MULTIPLIERS[state];
    const diff = Math.round((mul - 1.0) * 100);

    let text = "";
    let color = "#333";
    let bg = "#f4f4f4";
    let border = "#ddd";

    if (diff > 0) {
        text = `📈 Cost of Living is <strong>${Math.abs(diff)}% HIGHER</strong> than average.`;
        color = "#c0392b"; bg = "#fadbd8"; border = "#e6b0aa"; // Red for high cost
    } else {
        text = `📉 Cost of Living is <strong>${Math.abs(diff)}% LOWER</strong> than average.`;
        color = "#27ae60"; bg = "#d5f5e3"; border = "#a9dfbf"; // Green for low cost
    }

    contextDiv.innerHTML = text + ` (Rent & Food Impact)`;
    contextDiv.style.display = "block";
    contextDiv.style.color = color;
    contextDiv.style.background = bg;
    contextDiv.style.borderColor = border;
}

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

    goalIds.slice(0, 6).forEach(id => {
        const goal = DATA_ENGINE.ALL_GOALS[id];
        const pill = document.createElement("div");
        pill.className = "goal-pill";
        pill.innerText = goal.label;
        pill.onclick = () => {
            // Toggle Self
            pill.classList.toggle("active");

            // Limit 2
            const active = document.querySelectorAll(".goal-pill.active");
            if (active.length > 2) {
                pill.classList.remove("active");
                alert("Please select top 2 goals only.");
                return;
            }

            // Show Context
            updateGoalContext();
        };
        container.appendChild(pill);
    });
}

function updateGoalContext() {
    const activePills = document.querySelectorAll(".goal-pill.active");
    const contextDiv = document.getElementById("goal-context-display");

    if (activePills.length === 0) {
        contextDiv.style.display = "none";
        return;
    }

    // Capture the last clicked one (heuristic) or just avg the active ones
    // For simplicity, let's show summary of the FIRST active goal
    const goalLabel = activePills[0].innerText;
    // Find ID by label (inverse lookup or iterate)
    const goalEntry = Object.values(DATA_ENGINE.ALL_GOALS).find(g => g.label === goalLabel);

    if (goalEntry) {
        contextDiv.innerHTML = `
            <strong>${goalEntry.label}:</strong> Avg Cost ${goalEntry.cost} over ${goalEntry.horizon} Term. <br>
            <span style='font-size:0.75rem; color:#666;'>${goalEntry.primer}</span>
         `;
        contextDiv.style.display = "block";
    }
}

// ==========================================
// 6. STRATEGY ENGINE (PAGE 5 & 6)
// ==========================================

// NEW: Helper to determine Tenure
function determineTenure(goals) {
    if (!goals || goals.length === 0) return 10; // Default

    let totalYears = 0;
    let count = 0;

    goals.forEach(gLabel => {
        // Reverse lookup or search
        const gEntry = Object.values(DATA_ENGINE.ALL_GOALS).find(g => g.label === gLabel);
        if (gEntry) {
            let y = 5; // Medium
            if (gEntry.horizon.includes("Short")) y = 2;
            else if (gEntry.horizon.includes("Long")) y = 15;
            else y = 7;

            totalYears += y;
            count++;
        }
    });

    const avg = Math.round(totalYears / count);
    return Math.max(3, Math.min(30, avg)); // Clamp 3-30
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

    // NEW: Calculate Dynamic Tenure based on Goals
    const tenure = determineTenure(GLOBAL_STATE.demographics.goals);

    // Update UI elements if they exist (Page 5)
    setTimeout(() => {
        const tInput = document.getElementById("input-tenure");
        const tVal = document.getElementById("tenure-val");
        if (tInput) tInput.value = tenure;
        if (tVal) tVal.innerText = tenure + " Years";
    }, 500);

    // 2. LOGIC STEP B: GENERATE RECOMMENDATION
    console.log("Generating Strategy...", GLOBAL_STATE);
    goToPage(5);

    // Trigger Async Loaders
    runAssetAllocationEngine(tenure); // Pass calculated tenure
    runTaxOptimizer();

    // Trigger Insights & Scenarios
    setTimeout(() => {
        renderStrategyInsights(GLOBAL_STATE.persona);
        updateScenarioAnalysis();
    }, 100);
}

// ==========================================
// 6. STRATEGY ENGINE (PAGE 5 & 6)
// ==========================================

function runAssetAllocationEngine(horizonInput) {
    // 1. Prepare Payload
    // If we have AI persona, we use it. Else rule-based.

    // Heuristic Risk Score
    let risk = 2; // Moderate
    const pKey = GLOBAL_STATE.persona || "mehta";
    if (["jethalal", "babita", "roshan", "daya", "tapu"].includes(pKey)) risk = 3;
    if (["bhide", "popatlal", "champaklal", "abdul"].includes(pKey)) risk = 1;

    const horizon = horizonInput || 10;

    // Call Backend
    const presPayload = {
        age: parseInt(GLOBAL_STATE.demographics.age.split("-")[0]) || 30,
        income: GLOBAL_STATE.income,
        horizon_years: horizon,
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

    // Design System Colors: Equity (Emerald), Debt (Blue), Gold (Yellow)
    const dsColors = ['#10b981', '#3b82f6', '#f59e0b'];

    window.allocChartInstance = new Chart(ctx, {
        type: 'doughnut', // Better than Pie
        data: {
            labels: ['Equity (Growth)', 'Debt (Safety)', 'Gold (Hedge)'],
            datasets: [{
                data: [data.equity, data.debt, data.gold],
                backgroundColor: dsColors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Inter', size: 12 },
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            cutout: '60%' // Modern look
        }
    });

    // Details Text
    const details = document.getElementById("allocation-details");
    details.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
            <span style="color:${dsColors[0]};">● Equity</span>
            <strong>${data.equity}%</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
            <span style="color:${dsColors[1]};">● Debt</span>
            <strong>${data.debt}%</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
            <span style="color:${dsColors[2]};">● Gold</span>
            <strong>${data.gold}%</strong>
        </div>
        <div style="margin-top:15px; padding:10px; background:#f9f9f9; border-left:4px solid var(--color-primary); font-size:0.85rem; color:#555; line-height:1.4;">
            <em>Strategy: "${data.reco || "AI Generated"}"</em>
        </div>
    `;
}
// ...
// ...
function renderStrategyInsights(personaKey) {
    // ...
    // ...
    const pData = DATA_ENGINE.PERSONAS[personaKey] || DATA_ENGINE.PERSONAS['mehta'];

    // Personalized Nudge based on Ruler/Traits
    const nudge = `Since you are ruled by <strong>${pData.ruler}</strong> (` + pData.traits.join(", ") + `), your strategy balances your natural tendency to <em>${pData.role.split("The ")[1]}</em>.`;

    document.getElementById("strategy-pros").innerHTML = `<li>${nudge}</li><li><strong>Why this works:</strong> Matches your ${GLOBAL_STATE.demographics.goals.length} goals with a ${document.getElementById("input-tenure").value}Y Horizon.</li>`;

    // Risk Warning personalized
    let riskWarn = "Market Volatility";
    if (pData.traits.includes("High Risk")) riskWarn = "Over-exposure to Sectoral Bets";
    if (pData.traits.includes("Fearful")) riskWarn = "Inflation eroding idle cash";

    document.getElementById("strategy-cons").innerHTML = `<li><strong>Watch out for:</strong> ${riskWarn}.</li>`;

    // Market Context
    document.getElementById("market-assumption").innerHTML = `Bullish (Nifty PE 22.5)`;
}

function runTaxOptimizer() {
    // 1. Calculate Targets
    // Rule: Max 1.5L under 80C
    const income = GLOBAL_STATE.income;
    const invAmount = income * 0.2 * 12; // Annual Savings

    const container = document.getElementById("tax-strategy-content");
    container.innerHTML = `<div class="loading-text">Analyzing 80C & Tax Slabs...</div>`;

    // 2. Prepare Payload for Backend
    const payload = {
        investment_amount: invAmount,
        risk_profile: 2
    };

    // 3. Fallback Logic (Local Heuristic)
    const runFallback = () => {
        console.warn("Using Local Tax Heuristics.");
        // Logic: 
        // 1. 80C Limit = 1.5L
        // 2. Existing Probable Investments (EPF/Life Insurance) = ~5% of Income
        const existing80C = Math.round(income * 0.05);
        const gap80C = Math.max(0, 150000 - existing80C);

        let elss = 0, ppf = 0, insurance = 0;

        if (gap80C > 0) {
            // Allocate Gap
            if (GLOBAL_STATE.persona === "bhide" || GLOBAL_STATE.persona === "popatlal") {
                ppf = gap80C; // Risk Averse -> PPF
            } else {
                elss = Math.round(gap80C * 0.7); // Growth -> ELSS
                ppf = gap80C - elss;
            }
        }

        // Render Fallback
        let html = `<div style="margin-bottom:10px; color:#27ae60; font-weight:bold;">Strategy: Fill ₹${(gap80C / 1000).toFixed(0)}k 80C Gap</div>`;

        if (gap80C === 0) {
            html += `<div style="color:#555; font-size:0.9rem;">Great job! Your Section 80C (₹1.5L) is likely covered by EPF/Insurance. Focus on Wealth Creation (Equity) now.</div>`;
        } else {
            if (elss > 0) html += `<div class="tax-row"><span>ELSS (Tax Saver)</span><span>₹${(elss / 1000).toFixed(0)}k</span></div>`;
            if (ppf > 0) html += `<div class="tax-row"><span>PPF / EPF Vol</span><span>₹${(ppf / 1000).toFixed(0)}k</span></div>`;

            // Add Term Insurance heuristic if Age < 40
            const ageVal = parseInt(GLOBAL_STATE.demographics.age) || 30;
            if (ageVal < 40) {
                html += `<div class="tax-row"><span>Term Insurance</span><span>₹15k</span></div>`;
            }

            html += `<div style="font-size:0.8em; color:#888; margin-top:5px;">Projected Tax Saved: ₹${(gap80C * 0.3).toFixed(0)} (Old Regime)</div>`;
        }
        container.innerHTML = html;
    };

    // 4. Try Network call with Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s Timeout

    fetch("https://gokuldham-backend.onrender.com/analyze/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
    })
        .then(res => {
            if (!res.ok) throw new Error("Server Error");
            return res.json();
        })
        .then(data => {
            clearTimeout(timeoutId);
            // Success Render
            let html = `<div style="margin-bottom:10px; color:#27ae60; font-weight:bold;">${data.message}</div>`;
            for (const [key, val] of Object.entries(data.allocation)) {
                if (val && val !== "₹0") {
                    html += `
                <div class="tax-row">
                    <span>${key}</span>
                    <span>${val}</span>
                </div>`;
                }
            }
            html += `<div style="font-size:0.8em; color:#888; margin-top:5px;">Projected 1Y Yield: ₹${data.projected_return_1y}</div>`;
            container.innerHTML = html;
        })
        .catch(e => {
            // Run Fallback on ANY error (Network, Timeout, Server)
            runFallback();
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

    // Switch to Python Backend for Chat (More reliable than Vercel Node for this setup)
    fetch("https://gokuldham-backend.onrender.com/inspector/ask", {
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

// ==========================================
// 9. TAX EFFICIENCY ENGINE (NEW V15)
// ==========================================
function renderTaxWiseWithdrawal() {
    const rules = window.DATA_ENGINE.TAX_RULES_2024;
    if (!rules) return;

    const container = document.getElementById("tax-withdrawal-content");
    if (!container) return; // Need to create this DIV in HTML next

    let html = `
        <div style="font-family: 'Space Mono', monospace; font-size: 0.8rem; margin-bottom: 15px; color: #555;">
            SMART REDEMPTION ORDER (To minimize tax):
        </div>
        <div class="withdrawal-grid">
            <div class="w-card">
                <div class="w-header equity">1. EQUITY (Long Term)</div>
                <div class="w-body">
                    <div class="w-row"><span>Wait:</span> <strong>> 1 Year</strong></div>
                    <div class="w-row"><span>Tax:</span> <strong>12.5%</strong></div>
                    <div class="w-note">${rules.equity.exemption}</div>
                </div>
            </div>
            <div class="w-card">
                <div class="w-header gold">2. GOLD (Long Term)</div>
                <div class="w-body">
                    <div class="w-row"><span>Wait:</span> <strong>> 2 Years</strong></div>
                    <div class="w-row"><span>Tax:</span> <strong>12.5%</strong></div>
                    <div class="w-note">New Rule (Budget '24)</div>
                </div>
            </div>
            <div class="w-card">
                <div class="w-header debt">3. DEBT (Emergency)</div>
                <div class="w-body">
                    <div class="w-row"><span>Wait:</span> <strong>Any Time</strong></div>
                    <div class="w-row"><span>Tax:</span> <strong>Slab Rate</strong></div>
                    <div class="w-note">Use for liquidity only</div>
                </div>
            </div>
        </div>
        
        <div style="background:#fff3cd; padding:10px; border-radius:4px; margin-top:15px; font-size:0.8rem; border-left:4px solid #f1c40f;">
            <strong>💡 Pro Tip:</strong> If you need cash, sell assets with <em>Losses</em> first (Tax Harvesting), then Equity < ₹1.25L gain.
        </div>
    `;

    container.innerHTML = html;
}

// ==========================================
// 10. DYNAMIC REBALANCING LOGIC (V16)
// ==========================================
function updateRebalancingSchedule(tenureYears) {
    const container = document.getElementById("rebalancing-content");
    if (!container) return;

    // Logic Factors
    const pKey = GLOBAL_STATE.persona || "mehta";
    const isHighRisk = ["jethalal", "babita", "roshan"].includes(pKey);
    const isShortTerm = tenureYears < 5;

    let frequency = "Yearly";
    let logic = "Long-term compounding needs patience. Excessive churning hurts returns.";
    let dateOffsetMonths = 12;

    if (isShortTerm) {
        frequency = "Quarterly";
        logic = "Short tenure (< 5y) requires tight risk management to protect capital.";
        dateOffsetMonths = 3;
    } else if (isHighRisk) {
        frequency = "Semi-Annually";
        logic = "High-risk portfolio needs containment. Rebalance if equity deviates > 5%.";
        dateOffsetMonths = 6;
    }

    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + dateOffsetMonths);

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span style="font-size:0.9rem; color:#555;">Frequency:</span>
            <span style="font-weight:bold; color:#d35400;">${frequency}</span>
        </div>
        <div class="tax-row" style="background:#fff3e0; border-left:4px solid #f39c12;">
            <span>Next Review Date</span>
            <span>${nextDate.toLocaleDateString()}</span>
        </div>
        <p style="font-size:0.8rem; color:#666; margin-top:10px; font-style:italic;">
            <strong>Why?</strong> ${logic}
        </p>
    `;
}

// ==========================================
// 8. SCENARIO ANALYSIS & INSIGHTS (NEW V14)
// ==========================================

function renderStrategyInsights(personaKey) {
    const pData = DATA_ENGINE.PERSONAS[personaKey] || DATA_ENGINE.PERSONAS['mehta'];

    // 1. Mock Pros/Cons based on Persona Ruler
    let pros = ["Customized for your risk profile", "High inflation-adjusted returns"];
    let cons = ["Market volatility exposure", "Lock-in period for tax saving"];
    let market = "Bullish (India Growth @ 7%)";

    // Heuristics
    if (pData.traits.includes("High Risk")) {
        pros = ["Aggressive Wealth Creation", "Maximizes Compounding", "Tax Efficient (LTCG)"];
        cons = ["High Short-term Volatility", "Not suitable for < 3yr goals"];
    } else if (pData.traits.includes("Risk Averse")) {
        pros = ["Capital Protection", "Steady Income Stream", "Low Volatility"];
        cons = ["May barely beat inflation", "Lower final corpus"];
    }

    // 2. Inject
    const prosContainer = document.getElementById("strategy-pros");
    const consContainer = document.getElementById("strategy-cons");
    const marketContainer = document.getElementById("market-assumption");

    if (prosContainer) prosContainer.innerHTML = pros.map(i => `<li>${i}</li>`).join('');
    if (consContainer) consContainer.innerHTML = cons.map(i => `<li>${i}</li>`).join('');
    if (marketContainer) marketContainer.innerText = market;
}

let scenarioChartInstance = null;

function updateScenarioAnalysis() {
    // 1. Get Params
    const tenure = parseInt(document.getElementById("input-tenure").value) || 10;
    document.getElementById("tenure-val").innerText = tenure + " Years";

    // Monthly SIP based on 20% savings of Income
    const income = GLOBAL_STATE.income || 50000;
    const monthlySIP = Math.round(income * 0.2);

    // Allocation Logic (or Default 50/30/20)
    const alloc = GLOBAL_STATE.recommendation || { equity: 50, debt: 30, gold: 20 };

    // 2. Returns Assumptions (Real Rates)
    const R_EQUITY = 0.12;
    const R_DEBT = 0.07;
    const R_GOLD = 0.08;

    // Weighted Avg Monthly Return
    const wRateAnnual = ((alloc.equity * R_EQUITY) + (alloc.debt * R_DEBT) + (alloc.gold * R_GOLD)) / 100;

    // 3. Scenarios (CAGR Deviations)
    const deviation = 0.04; // +/- 4%

    // FV Calculation: P * [ (1+r)^n - 1 ] * (1+r)/r
    function calculateCorpus(rateAnnual) {
        const months = tenure * 12;
        const r = rateAnnual / 12;
        const corpus = monthlySIP * ((Math.pow(1 + r, months) - 1) * (1 + r) / r);
        return Math.round(corpus / 100000); // Return in Lakhs
    }

    const investedL = Math.round((monthlySIP * 12 * tenure) / 100000);
    const bearL = calculateCorpus(wRateAnnual - deviation);
    const baseL = calculateCorpus(wRateAnnual);
    const bullL = calculateCorpus(wRateAnnual + deviation);

    // 4. Render Chart
    const ctx = document.getElementById('scenarioChart');
    if (!ctx) return;

    if (scenarioChartInstance) scenarioChartInstance.destroy();

    scenarioChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Bear (Poor)', 'Base (Expected)', 'Bull (Great)'],
            datasets: [
                {
                    label: 'Principal Invested',
                    data: [investedL, investedL, investedL],
                    backgroundColor: '#bdc3c7',
                    stack: 'Stack 0'
                },
                {
                    label: 'Wealth Gained',
                    data: [bearL - investedL, baseL - investedL, bullL - investedL],
                    backgroundColor: ['#e74c3c', '#f1c40f', '#2ecc71'],
                    stack: 'Stack 0'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ₹' + context.raw + ' Lakhs';
                        },
                        footer: function (tooltipItems) {
                            const total = tooltipItems.reduce((a, e) => a + e.raw, 0);
                            return 'Total Corpus: ₹' + total + ' Lakhs';
                        }
                    }
                },
                legend: { position: 'bottom' }
            },
            scales: {
                y: {
                    stacked: true,
                    title: { display: true, text: 'Corpus (₹ Lakhs)' },
                    ticks: { callback: v => '₹' + v + 'L' }
                },
                x: { stacked: true }
            }
        }
    });

    // 5. Context
    const legendDiv = document.querySelector(".scenario-legend");
    if (legendDiv) {
        legendDiv.innerHTML = `
            <div style="margin-top:15px; font-size:0.8rem; color:#666; text-align:left; background:#f9f9f9; padding:10px; border-radius:4px;">
                <div><strong>Wealth Context:</strong></div>
                <ul style="margin:5px 0 0 15px; padding:0;">
                    <li>Invested: <strong>₹${investedL} Lakhs</strong> (via ₹${(monthlySIP / 1000).toFixed(1)}k SIP)</li>
                    <li>Weighted Return: <strong>${(wRateAnnual * 100).toFixed(1)}%</strong> (based on your mix)</li>
                    <li>Bull Case: <strong>₹${bullL} Lakhs</strong> @ ${(wRateAnnual * 100 + 4).toFixed(1)}%</li>
                </ul>
            </div>
        `;
    }

    // TRIGGER DAISY CHAIN
    if (typeof renderTaxWiseWithdrawal === "function") renderTaxWiseWithdrawal();
    if (typeof updateRebalancingSchedule === "function") updateRebalancingSchedule(tenure);
}
