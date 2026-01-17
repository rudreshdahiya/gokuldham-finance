// ==========================================
// SPEND-TREK 2.0: LOGIC ENGINE (V12.0 - The 6-Page Flow)
// ==========================================

// --- STATE MANAGEMENT ---
let GLOBAL_STATE = {
    income: 0,
    alloc: { needs: 50, wants: 30, savings: 20 },
    persona: null,
    demographics: { age: "29-39", state: "maharashtra", goals: [] },
    recommendation: null,
    theme: localStorage.getItem('theme') || 'light' // Theme State
};

// ==========================================
// 1. NAVIGATION & INITIALIZATION
// ==========================================

function initUI() {
    console.log("🚀 Initializing Google Bank UI...");

    // 1. Apply Theme
    document.body.setAttribute('data-theme', GLOBAL_STATE.theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.innerText = GLOBAL_STATE.theme === 'dark' ? '🌙' : '☀️';

    // 2. Navigation Init
    // Check for previous session? (Optional: Restore from local storage)
    // For MVP, start fresh or Page 1.
    goToPage(1);

    // Populate Dynamic Dropdowns (States)
    populateStates();
}

function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    document.body.setAttribute('data-theme', next);
    GLOBAL_STATE.theme = next;
    localStorage.setItem('theme', next);

    const icon = document.getElementById('theme-icon');
    if (icon) icon.innerText = next === 'dark' ? '🌙' : '☀️';
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

    // 3. REASONING LOGIC (Personalized)
    const reason = generateReasoning(personaKey, GLOBAL_STATE.alloc);

    const statContainer = document.querySelector(".persona-stat");
    statContainer.innerHTML = `
        <div style="margin-bottom:15px;">
            <div style="font-size:0.7rem; font-weight:bold; color:var(--color-primary); letter-spacing:1px; margin-bottom:5px;">WHY THIS MATCH?</div>
            <div style="font-family:var(--font-mono); font-size:0.85rem; color:var(--color-text-main);">"${reason}"</div>
        </div>
    `;

    // 4. NEIGHBORS (Closest Matches with Directional Hints)
    const neighbors = PERSONA_TRIBES[personaKey] || ["mehta", "bhide"];
    let neighborsHtml = `<div style="display:flex; justify-content:center; gap:15px; margin-top:10px;">`;

    neighbors.forEach(nKey => {
        const nData = DATA_ENGINE.PERSONAS[nKey];
        if (nData) {
            // === DIRECTIONAL COMPARISON LOGIC ===
            // Compare user's N/W/S to neighbor's archetype
            const userNeeds = GLOBAL_STATE.alloc.needs || 50;
            const userWants = GLOBAL_STATE.alloc.wants || 30;
            const userSavings = GLOBAL_STATE.alloc.savings || 20;

            let directionHint = "";

            // Heuristic: Match persona archetype to typical allocation
            // (This is simplified - ideally from DATA_ENGINE.PERSONAS metadata)
            const archetypeMap = {
                // High Savers
                "bhide": { needs: 45, wants: 20, savings: 35 },
                "popatlal": { needs: 40, wants: 25, savings: 35 },
                "champaklal": { needs: 50, wants: 15, savings: 35 },
                "madhavi": { needs: 45, wants: 25, savings: 30 },

                // Balanced
                "mehta": { needs: 50, wants: 30, savings: 20 },
                "sodhi": { needs: 45, wants: 35, savings: 20 },
                "hathi": { needs: 55, wants: 25, savings: 20 },

                // High Spenders (Wants)
                "jethalal": { needs: 40, wants: 45, savings: 15 },
                "babita": { needs: 35, wants: 50, savings: 15 },
                "roshan": { needs: 40, wants: 45, savings: 15 },
                "daya": { needs: 45, wants: 40, savings: 15 },

                // Others
                "iyer": { needs: 50, wants: 30, savings: 20 },
                "anjali": { needs: 45, wants: 35, savings: 20 },
                "komal": { needs: 50, wants: 25, savings: 25 },
                "gogi": { needs: 40, wants: 50, savings: 10 }
            };

            const neighborAlloc = archetypeMap[nKey] || { needs: 50, wants: 30, savings: 20 };

            // Calculate biggest difference
            const savingsDiff = neighborAlloc.savings - userSavings;
            const wantsDiff = neighborAlloc.wants - userWants;
            const needsDiff = neighborAlloc.needs - userNeeds;

            // Pick the most significant difference
            if (Math.abs(savingsDiff) > Math.abs(wantsDiff) && Math.abs(savingsDiff) > Math.abs(needsDiff)) {
                if (savingsDiff > 5) directionHint = `Saves ${Math.round(savingsDiff)}% more`;
                else if (savingsDiff < -5) directionHint = `Saves ${Math.abs(Math.round(savingsDiff))}% less`;
                else directionHint = "Similar Saver";
            } else if (Math.abs(wantsDiff) > Math.abs(needsDiff)) {
                if (wantsDiff > 5) directionHint = `Spends ${Math.round(wantsDiff)}% more on Wants`;
                else if (wantsDiff < -5) directionHint = `Spends ${Math.abs(Math.round(wantsDiff))}% less on Wants`;
                else directionHint = "Similar Lifestyle";
            } else {
                if (needsDiff > 5) directionHint = `${Math.round(needsDiff)}% more on Needs`;
                else if (needsDiff < -5) directionHint = `${Math.abs(Math.round(needsDiff))}% less on Needs`;
                else directionHint = "Near Twin";
            }

            neighborsHtml += `
            <div style="text-align:center; opacity:0.85;">
                <img src="${nData.img}" style="width:45px; height:45px; border-radius:50%; border:2px solid var(--color-border); box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                <div style="font-size:0.65rem; margin-top:5px; font-weight:bold; color:var(--color-text-main);">${nData.name}</div>
                <div style="font-size:0.55rem; color:var(--color-primary); font-weight:500; margin-top:2px;">${directionHint}</div>
            </div>`;
        }
    });
    neighborsHtml += `</div>`;

    statContainer.innerHTML += `
        <div style="border-top:1px dashed var(--color-border); margin-top:15px; padding-top:15px;">
             <div style="font-size:0.7rem; font-weight:bold; color:var(--color-text-muted); letter-spacing:1px; margin-bottom:10px;">CLOSEST MATCHES</div>
             ${neighborsHtml}
        </div>
    `;
}

function generateReasoning(personaKey, alloc) {
    // 1. Extract Highs
    const { needs, wants, savings } = alloc;
    let highCat = "Balanced";
    if (needs > 60) highCat = "Needs";
    if (wants > 40) highCat = "Wants";
    if (savings > 40) highCat = "Savings";

    // 2. Specific Logic per Persona
    // JETHALAL (Risk Taker)
    if (personaKey === 'jethalal') {
        if (wants > 40) return `You spend ${wants}% on Wants, just like Jethalal spends on Gada Electronics' unnecessary schemes.`;
        if (savings < 20) return `Your low savings (${savings}%) reflect Jethalal's tendency to constantly run out of cash.`;
        return `You live life king size, prioritizing business and fun logic over disciplined savings.`;
    }

    // BHIDE (Saver)
    if (personaKey === 'bhide') {
        if (savings > 30) return `Your disciplined ${savings}% savings rate would make Atmaram Bhide proud!`;
        if (wants < 20) return `You keep your Wants low (${wants}%), acting as the 'Secretary' of your own wallet.`;
        return `You prioritize financial discipline and 'Hamare Zamaane' ke values over loose spending.`;
    }

    // POPATLAL (Anxious Saver)
    if (personaKey === 'popatlal') {
        return `You are saving aggressively (${savings}%) essentially for a 'future event' (aka Shaadi) that hasn't happened yet.`;
    }

    // IYER (Scientist / Balanced)
    if (personaKey === 'iyer') {
        return `Your allocation (N:${needs}/W:${wants}/S:${savings}) is scientifically balanced, just like Iyer's logic.`;
    }

    // ROSHAN (Party / Wants)
    if (personaKey === 'roshan') {
        return `Your ${wants}% spending on Wants shows you love to party first and worry about accounts later!`;
    }

    // MEHTA (The Guide / Standard)
    if (personaKey === 'mehta') {
        return `You follow the 'Golden Mean'. Not too stingy, not too extravagant. A balanced diet for your wallet.`;
    }

    // BABITA (Luxury)
    if (personaKey === 'babita') {
        return `Your lifestyle demands high maintenance. ${wants}% on Wants aligns with high aesthetic standards.`;
    }

    // Default Fallback with data
    return `Your ${highCat}-heavy approach (N:${needs}% / W:${wants}% / S:${savings}%) aligns perfectly with ${personaKey.toUpperCase()}'s psychology.`;
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

    // === PERSONA-DRIVEN FALLBACK (The Magic!) ===
    // Start with 9-rule matrix base
    let baseEquity = 50, baseDebt = 30, baseGold = 20;

    // Horizon adjustment
    if (horizon < 5) { baseEquity = 40; baseDebt = 45; baseGold = 15; }
    else if (horizon > 15) { baseEquity = 70; baseDebt = 20; baseGold = 10; }

    // Risk adjustment
    if (risk === 3) { baseEquity += 15; baseDebt -= 10; } // Aggressive
    if (risk === 1) { baseEquity -= 15; baseDebt += 15; } // Conservative

    // === PERSONA TRAIT MODIFIERS (Character-Specific Behavior) ===
    const pData = DATA_ENGINE.PERSONAS[pKey] || DATA_ENGINE.PERSONAS['mehta'];

    if (pKey === "jethalal") {
        baseEquity += 10; // Risk-taker, chases high returns
        baseGold -= 5;    // "Gold is for cowards"
    }
    if (pKey === "popatlal") {
        baseDebt += 10;   // Anxious, needs safety
        baseEquity -= 10; // Fear of market volatility
    }
    if (pKey === "babita") {
        baseDebt += 5;    // Needs liquidity for lifestyle
        baseEquity -= 5;
    }
    if (pKey === "bhide") {
        baseDebt += 5;    // Disciplined but conservative
        baseGold += 5;    // Trust in traditional assets
        baseEquity -= 10;
    }
    if (pKey === "champaklal") {
        baseDebt += 15;   // Maximum safety for retiree
        baseEquity -= 15;
    }

    // === USER SPENDING BEHAVIOR MODIFIER ===
    const userSavings = GLOBAL_STATE.alloc.savings || 20;
    if (userSavings > 30) {
        baseEquity += 5; // Reward high savers with growth
        baseDebt -= 5;
    } else if (userSavings < 15) {
        baseEquity -= 5; // Low savers need safety buffer
        baseDebt += 5;
    }

    // === GOAL-SPECIFIC ADJUSTMENTS ===
    const goals = GLOBAL_STATE.demographics.goals || [];

    if (goals.some(g => g.includes("Wedding") || g.includes("Car") || g.includes("Vacation"))) {
        baseDebt += 10;   // Short-term goals need liquidity
        baseEquity -= 10;
    }
    if (goals.includes("FIRE (Retire Early)") || goals.includes("SIP Portfolio")) {
        baseEquity += 10; // Long-term wealth focus
        baseDebt -= 5;
        baseGold -= 5;
    }
    if (goals.includes("Parental Medical Care") || goals.includes("Emergency Fund")) {
        baseDebt += 10;   // Immediate access critical
        baseEquity -= 10;
    }

    // Clamp to valid ranges
    baseEquity = Math.max(20, Math.min(85, baseEquity));
    baseDebt = Math.max(10, Math.min(60, baseDebt));
    baseGold = 100 - baseEquity - baseDebt; // Residual

    const mockPrescription = {
        equity: baseEquity,
        debt: baseDebt,
        gold: baseGold,
        confidence: "High",
        reco: `${pData.name}'s Strategy: ${baseEquity > 60 ? "Aggressive Growth" : baseEquity < 40 ? "Conservative Safety" : "Balanced Approach"}`,
        allocation: { equity: baseEquity, debt: baseDebt, gold: baseGold } // For other functions
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
// Personalized Strategy DNA: Pros, Risks, and Allocation Reasoning
function renderStrategyInsights(personaKey) {
    const pData = DATA_ENGINE.PERSONAS[personaKey] || DATA_ENGINE.PERSONAS['mehta'];
    const goals = GLOBAL_STATE.demographics.goals || [];
    const tenure = parseInt(document.getElementById("input-tenure").value) || 10;
    const alloc = GLOBAL_STATE.recommendation.allocation; // {equity, debt, gold}

    // === ALLOCATION REASONING ===
    const reasonDiv = document.getElementById('allocation-reasoning');
    if (reasonDiv) {
        let allocReason = `Your ${alloc.equity}/${alloc.debt}/${alloc.gold} split comes from the '9-Rule Matrix' (Risk × Horizon). `;

        // Persona-specific nudge
        if (personaKey === 'bhide' || personaKey === 'popatlal') {
            allocReason += `As a risk-averse saver, we've capped Equity to protect your peace of mind.`;
        } else if (personaKey === 'jethalal' || personaKey === 'roshan') {
            allocReason += `Your risk appetite allows high Equity for wealth creation, but we've added Debt as a safety net.`;
        } else allocReason += `Your balanced approach ensures steady growth without sleepless nights.`;

        reasonDiv.innerText = allocReason;
    }

    // === STRENGTHS (Pros) ===
    const pros = [];

    // Goal-Specific Strengths
    if (goals.includes("FIRE (Retire Early)") || goals.includes("SIP Portfolio")) {
        pros.push(`<strong>Aligned with FIRE Goal:</strong> High Equity (${alloc.equity}%) accelerates wealth creation over ${tenure} years.`);
    }
    if (goals.includes("First Home Purchase")) {
        pros.push(`<strong>Down Payment Focus:</strong> Debt allocation (${alloc.debt}%) provides liquidity when you need it.`);
    }
    if (goals.includes("Parental Medical Care")) {
        pros.push(`<strong>Emergency Buffer:</strong> Gold + Debt (${alloc.debt + alloc.gold}%) ensures you can cover sudden medical expenses.`);
    }

    // Persona-Specific Strengths
    if (pData.traits.includes("Disciplined")) {
        pros.push(`<strong>SIP Discipline:</strong> Your ${pData.name}-like consistency turns average returns into compounding magic.`);
    }
    if (pData.traits.includes("High Risk")) {
        pros.push(`<strong>Market Timing:</strong> Your risk appetite could capture 15%+ CAGR during bull runs.`);
    }

    // Fallback
    if (pros.length === 0) {
        pros.push(`Diversified across 3 asset classes to balance risk and reward.`);
        pros.push(`Aligned with ${tenure}-year timeline and your ${goals.length} priority goals.`);
    }

    document.getElementById("strategy-pros").innerHTML = pros.map(p => `<li>${p}</li>`).join('');

    // === WATCH OUT FOR (Risks) ===
    const risks = [];

    // Goal-Specific Risks
    if (goals.includes("Luxury Car") || goals.includes("Destination Wedding")) {
        risks.push(`<strong>Lifestyle Inflation:</strong> High-cost short-term goals (Wedding/Car) could derail your SIP discipline.`);
    }
    if (alloc.equity > 70) {
        risks.push(`<strong>Market Volatility:</strong> High Equity (${alloc.equity}%) means 20-30% drawdowns during corrections are normal.`);
    }
    if (alloc.debt < 15 && tenure < 5) {
        risks.push(`<strong>Liquidity Crunch:</strong> Low Debt allocation for short goals means you might need to sell Equity at a loss.`);
    }

    // Persona-Specific Risks
    if (personaKey === 'jethalal') {
        risks.push(`<strong>Impulse Spending:</strong> Like Jethalal's schemes, avoid dipping into SIPs for 'urgent business opportunities'.`);
    }
    if (personaKey === 'babita' || personaKey === 'roshan') {
        risks.push(`<strong>Wants Overspending:</strong> Your lifestyle costs (${GLOBAL_STATE.alloc.wants}%) could eat into SIP capacity.`);
    }
    if (pData.traits.includes("Fearful")) {
        risks.push(`<strong>Panic Selling:</strong> Market dips will test your nerves. Stick to the plan or switch to conservative mode.`);
    }

    // Fallback
    if (risks.length === 0) {
        risks.push(`Ensure SIP auto-debit to avoid skipping months during market dips.`);
        risks.push(`Rebalance annually to maintain ${alloc.equity}/${alloc.debt}/${alloc.gold} ratio.`);
    }

    document.getElementById("strategy-cons").innerHTML = risks.map(r => `<li>${r}</li>`).join('');

    // === MARKET CONTEXT ===
    // TODO: Replace with live Nifty PE if API available
    document.getElementById("market-assumption").innerHTML = `Bullish (Nifty PE ~22.5, India remains EM favorite)`;
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
// 9. TAX EFFICIENCY ENGINE (PERSONALIZED)
// ==========================================
function renderTaxWiseWithdrawal() {
    const rules = window.DATA_ENGINE.TAX_RULES_2024;
    if (!rules) return;

    const container = document.getElementById("tax-withdrawal-content");
    if (!container) return;

    // === PERSONALIZATION INPUTS ===
    const alloc = GLOBAL_STATE.recommendation?.allocation || { equity: 50, debt: 30, gold: 20 };
    const income = GLOBAL_STATE.income || 50000;
    const goals = GLOBAL_STATE.demographics.goals || [];
    const tenure = parseInt(document.getElementById("input-tenure")?.value) || 10;

    // Determine tax bracket (simplified Indian slab)
    const annualIncome = income * 12;
    let taxBracket = "30%"; // Default
    if (annualIncome < 500000) taxBracket = "5%";
    else if (annualIncome < 1000000) taxBracket = "20%";

    // Check for short-term goals
    const hasShortGoal = tenure < 5 || goals.some(g => g.includes("Wedding") || g.includes("Car") || g.includes("Vacation"));

    let html = `
        <div style="font-family: 'Space Mono', monospace; font-size:0.75rem; margin-bottom: 15px; color:var(--color-text-muted); background:var(--color-bg); padding:8px; border-radius:4px;">
            SMART REDEMPTION ORDER (To minimize tax):
        </div>
        <div class="withdrawal-grid" style="display:grid; gap:10px; margin-bottom:15px;">
            <div class="w-card" style="background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:4px; padding:12px;">
                <div class="w-header equity" style="font-weight:bold; margin-bottom:8px; color:#27ae60;">1. EQUITY (Long Term)</div>
                <div class="w-body" style="font-size:0.8rem; color:var(--color-text-main);">
                    <div class="w-row" style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Wait:</span> <strong>> 1 Year</strong></div>
                    <div class="w-row" style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Tax:</span> <strong>12.5%</strong></div>
                    <div class="w-note" style="font-size:0.7rem; color:var(--color-text-muted); margin-top:5px;">${rules.equity.exemption}</div>
                </div>
            </div>
            <div class="w-card" style="background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:4px; padding:12px;">
                <div class="w-header gold" style="font-weight:bold; margin-bottom:8px; color:#f39c12;">2. GOLD (Long Term)</div>
                <div class="w-body" style="font-size:0.8rem; color:var(--color-text-main);">
                    <div class="w-row" style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Wait:</span> <strong>> 2 Years</strong></div>
                    <div class="w-row" style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Tax:</span> <strong>12.5%</strong></div>
                    <div class="w-note" style="font-size:0.7rem; color:var(--color-text-muted); margin-top:5px;">New Rule (Budget '24)</div>
                </div>
            </div>
            <div class="w-card" style="background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:4px; padding:12px;">
                <div class="w-header debt" style="font-weight:bold; margin-bottom:8px; color:#3498db;">3. DEBT (Emergency)</div>
                <div class="w-body" style="font-size:0.8rem; color:var(--color-text-main);">
                    <div class="w-row" style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Wait:</span> <strong>Any Time</strong></div>
                    <div class="w-row" style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Tax:</span> <strong>Slab Rate (${taxBracket})</strong></div>
                    <div class="w-note" style="font-size:0.7rem; color:var(--color-text-muted); margin-top:5px;">Use for liquidity only</div>
                </div>
            </div>
        </div>
        `;

    // === PERSONALIZED PRO TIP ===
    let proTip = "";

    if (alloc.equity > 60) {
        proTip = `Your ${alloc.equity}% equity allocation means most wealth will be taxed as LTCG (12.5%). Minimize withdrawals before 1-year holding period.`;
    } else if (hasShortGoal) {
        proTip = `Since you have short-term goals (${tenure}Y), prioritize debt withdrawals to avoid selling equity during market dips.`;
    } else if (alloc.debt < 20) {
        proTip = `Your low debt allocation (${alloc.debt}%) means emergency needs will force equity sales. Consider keeping ₹${(income * 6 / 1000).toFixed(0)}k (6 months) in liquid funds.`;
    } else {
        proTip = `If you need cash, sell assets with <em>Losses</em> first (Tax Harvesting), then Equity < ₹1.25L gain.`;
    }

    html += `
        <div style="background:#fff3cd; padding:12px; border-radius:4px; margin-top:10px; font-size:0.8rem; border-left:4px solid #f1c40f; color:#856404;">
            <strong>💡 Pro Tip (For You):</strong> ${proTip}
        </div>
    `;

    container.innerHTML = html;
}

// ==========================================
// 10. DYNAMIC REBALANCING LOGIC (PERSONALIZED)
// ==========================================
function updateRebalancingSchedule(tenureYears) {
    const container = document.getElementById("rebalancing-content");
    if (!container) return;

    // === PERSONALIZATION INPUTS ===
    const pKey = GLOBAL_STATE.persona || "mehta";
    const pData = DATA_ENGINE.PERSONAS[pKey] || DATA_ENGINE.PERSONAS['mehta'];
    const alloc = GLOBAL_STATE.recommendation?.allocation || { equity: 50, debt: 30, gold: 20 };
    const isHighRisk = ["jethalal", "babita", "roshan", "daya"].includes(pKey);
    const isLowRisk = ["bhide", "popatlal", "champaklal", "madhavi"].includes(pKey);
    const isShortTerm = tenureYears < 5;

    // === DETERMINE FREQUENCY ===
    let frequency = "Yearly";
    let logic = "";
    let dateOffsetMonths = 12;
    let deviationTrigger = "5%";

    if (isShortTerm) {
        frequency = "Quarterly";
        logic = `Your short ${tenureYears}-year horizon requires tight risk control. Review every 3 months to protect capital near goal date.`;
        dateOffsetMonths = 3;
        deviationTrigger = "3%";
    } else if (isHighRisk) {
        frequency = "Semi-Annually";
        logic = `As a ${pData.name}-type (high-risk taker), your portfolio needs containment. Rebalance every 6 months to avoid over-concentration.`;
        dateOffsetMonths = 6;
        deviationTrigger = "5%";
    } else if (isLowRisk) {
        frequency = "Yearly";
        logic = `Your conservative ${pData.name} approach benefits from patience. Annual rebalancing avoids excessive churning and tax events.`;
        dateOffsetMonths = 12;
        deviationTrigger = "7%";
    } else {
        frequency = "Yearly";
        logic = `Balanced portfolios perform best with minimal intervention. Review once a year to maintain discipline.`;
        dateOffsetMonths = 12;
        deviationTrigger = "5%";
    }

    // Calculate next review date
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + dateOffsetMonths);

    container.innerHTML = `
        <div style="background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:4px; padding:15px; color:var(--color-text-main);">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; padding-bottom:10px; border-bottom:1px dashed var(--color-border);">
                <span style="font-size:0.85rem; color:var(--color-text-muted);">Frequency:</span>
                <span style="font-weight:bold; color:var(--color-primary); font-size:0.95rem;">${frequency}</span>
            </div>
            
            <div style="background:var(--color-bg); border-left:4px solid var(--color-accent); padding:10px; border-radius:4px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.8rem;">
                    <span style="color:var(--color-text-muted);">Next Review Date:</span>
                    <span style="font-weight:bold; color:var(--color-text-main);">${nextDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                    <span style="color:var(--color-text-muted);">Trigger:</span>
                    <span style="font-weight:bold; color:var(--color-text-main);">If Equity drifts >${deviationTrigger} from ${alloc.equity}%</span>
                </div>
            </div>
            
            <div style="font-size:0.75rem; color:var(--color-text-muted); line-height:1.6; font-style:italic; background:var(--color-bg); padding:10px; border-radius:4px;">
                <strong style="color:var(--color-text-main);">Why ${frequency}?</strong><br>
                ${logic}
            </div>
            
            <div style="margin-top:12px; padding-top:12px; border-top:1px dashed var(--color-border); font-size:0.7rem; color:var(--color-text-muted);">
                <strong style="color:var(--color-primary);">How to Rebalance:</strong> If Equity > ${alloc.equity + parseInt(deviationTrigger)}%, sell equity funds and buy debt/gold to restore ${alloc.equity}/${alloc.debt}/${alloc.gold} ratio.
            </div>
        </div>
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
    // 1. Get Params from UI
    const tenureInput = document.getElementById("input-tenure");
    const tenureVal = document.getElementById("tenure-val");

    // Fix NaN bug: Use value from input or default
    const tenure = tenureInput ? (parseInt(tenureInput.value) || 10) : 10;
    if (tenureVal) tenureVal.innerText = tenure + " Years";

    // === PERSONALIZED SIP CALCULATION ===
    // Use actual income and savings % from user input
    const income = GLOBAL_STATE.income || 50000;
    const savingsRate = (GLOBAL_STATE.alloc.savings || 20) / 100; // Convert % to decimal
    const availableMonthlySIP = Math.round(income * savingsRate);

    // Allocation from backend or fallback
    const alloc = GLOBAL_STATE.recommendation?.allocation || { equity: 50, debt: 30, gold: 20 };

    // === GOAL-SPECIFIC CORPUS TARGET ===
    const goals = GLOBAL_STATE.demographics.goals || [];
    let targetCorpus = null; // In Lakhs
    let targetGoalLabel = "";

    // Map big-ticket goals to corpus targets (Simplified)
    const goalCorpusMap = {
        "FIRE (Retire Early)": 375, // ₹3.75Cr minimum
        "First Home Purchase": 80, // ₹80L down payment
        "Global Education (Kids)": 120, // ₹1.2Cr
        "Second Home (Hills)": 80,
        "Luxury Car": 15,
        "Destination Wedding": 15
    };

    // Find first matching goal with corpus target
    for (let g of goals) {
        if (goalCorpusMap[g]) {
            targetCorpus = goalCorpusMap[g];
            targetGoalLabel = g;
            break;
        }
    }

    // === RETURNS ASSUMPTIONS ===
    // Realistic rates for Indian retail investors
    const R_EQUITY = 0.12; // 12% historical Nifty 50
    const R_DEBT = 0.07;   // 7% FD/Debt Funds
    const R_GOLD = 0.08;   // 8% SGB

    // Weighted Average Annual Return
    const wRateAnnual = ((alloc.equity * R_EQUITY) + (alloc.debt * R_DEBT) + (alloc.gold * R_GOLD)) / 100;

    // === SCENARIO DEVIATIONS ===
    const deviation = 0.04; // ±4% covers most market cycles
    const bearRate = wRateAnnual - deviation;
    const baseRate = wRateAnnual;
    const bullRate = wRateAnnual + deviation;

    // === FV CALCULATION (SIP Future Value) ===
    function calculateCorpus(rateAnnual, monthlySIP) {
        const months = tenure * 12;
        const r = rateAnnual / 12;
        const corpus = monthlySIP * ((Math.pow(1 + r, months) - 1) * (1 + r) / r);
        return Math.round(corpus / 100000); // Return in Lakhs
    }

    const investedL = Math.round((availableMonthlySIP * 12 * tenure) / 100000);
    const bearL = calculateCorpus(bearRate, availableMonthlySIP);
    const baseL = calculateCorpus(baseRate, availableMonthlySIP);
    const bullL = calculateCorpus(bullRate, availableMonthlySIP);

    // === RENDER CHART ===
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
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const idx = context.dataIndex;
                            const total = [bearL, baseL, bullL][idx];
                            return context.dataset.label + ': ₹' + context.parsed.y + 'L (Total: ₹' + total + 'L)';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (v) => '₹' + v + 'L' }
                }
            }
        }
    });

    // === CONTEXTUAL WEALTH EXPLANATION ===
    const legDiv = document.querySelector('.scenario-legend');
    if (legDiv) {
        let contextHtml = `<div style="text-align:left; margin-top:15px; padding:15px; background:var(--color-bg-card); border-radius:4px; border:1px solid var(--color-border); font-size:0.8rem; line-height:1.6; color:var(--color-text-main);">
            <strong style="display:block; margin-bottom:8px; color:var(--color-primary);">📊 Wealth Context:</strong>
            <ul style="margin:0; padding-left:20px;">
                <li><strong>Your SIP Capacity:</strong> ₹${(availableMonthlySIP / 1000).toFixed(1)}k/month (${(savingsRate * 100).toFixed(0)}% of ₹${(income / 1000).toFixed(0)}k income)</li>
                <li><strong>Invested Over ${tenure}Y:</strong> ₹${investedL}L Principal</li>`;

        // Goal-specific comparison
        if (targetCorpus) {
            const gap = targetCorpus - baseL;
            if (gap > 0) {
                contextHtml += `<li><strong style="color:#e74c3c;">Gap to "${targetGoalLabel}":</strong> Need ₹${targetCorpus}L, Base Case gives ₹${baseL}L. <em>Shortfall: ₹${gap}L</em>. Consider increasing SIP or tenure.</li>`;
            } else {
                contextHtml += `<li><strong style="color:#27ae60;">On Track for "${targetGoalLabel}":</strong> Target ₹${targetCorpus}L, Base Case ₹${baseL}L ✓</li>`;
            }
        }

        contextHtml += `
                <li><strong>Bear Case (${(bearRate * 100).toFixed(1)}% CAGR):</strong> Market crash years. Total ₹${bearL}L.</li>
                <li><strong>Base Case (${(baseRate * 100).toFixed(1)}% CAGR):</strong> Historical avg. Total ₹${baseL}L.</li>
                <li><strong>Bull Case (${(bullRate * 100).toFixed(1)}% CAGR):</strong> Strong growth cycle. Total ₹${bullL}L.</li>
            </ul>
            <div style="margin-top:10px; font-size:0.75rem; font-style:italic; color:var(--color-text-muted);">
                Returns based on your ${alloc.equity}/${alloc.debt}/${alloc.gold} allocation mix. Equity@12%, Debt@7%, Gold@8% (historical averages).
            </div>
        </div>`;

        legDiv.innerHTML = contextHtml;
    }
}

// ==========================================
// INITIALIZATION
// ==========================================
window.addEventListener("DOMContentLoaded", initUI);
