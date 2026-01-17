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

function renderPersonaPage(personaKey, clusterId) {
    const pData = DATA_ENGINE.PERSONAS[personaKey] || DATA_ENGINE.PERSONAS['mehta'];

    document.getElementById("persona-name").innerText = pData.name.toUpperCase();
    document.getElementById("persona-desc").innerText = pData.quote;
    // document.getElementById("persona-cluster").innerText = clusterId || "CLUSTER-X"; // Hidden per user request

    // Image with Fallback and smooth load
    const container = document.getElementById("persona-image-container");
    const imgPath = pData.img || "assets/mehta.png"; // Fallback

    container.innerHTML = `<img src="${imgPath}" alt="${pData.name}" onerror="this.src='assets/mehta.png'">`;
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

    // Trigger Insights & Scenarios (V14)
    setTimeout(() => {
        renderStrategyInsights(GLOBAL_STATE.persona);
        updateScenarioAnalysis();
    }, 100);
}

// ==========================================
// 5. DOCUMENT LOADING (STYLES & LISTENERS)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    initUI();
});

// Helper: Populate States
function populateStates() {
    const select = document.getElementById('input-state');
    if (!select) return;

    // Use DATA_ENGINE source of truth
    const states = window.DATA_ENGINE ? window.DATA_ENGINE.ALL_STATES : [];

    states.forEach(state => {
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
        // Simple Logic: Fill 1.5L 80C first
        // Split: ELSS (60%), PPF (40%) for younger; PPF (100%) for risk averse.

        let elss = 0, ppf = 0, insurance = 0;
        const limit80C = 150000;

        // Capacity check
        const capacity = Math.min(invAmount, limit80C);

        if (GLOBAL_STATE.persona === "bhide" || GLOBAL_STATE.persona === "popatlal") {
            ppf = capacity; // Safety first
        } else {
            elss = capacity * 0.6; // Growth
            ppf = capacity * 0.4;
        }

        // Render Fallback
        let html = `<div style="margin-bottom:10px; color:#27ae60; font-weight:bold;">Strategy: Maximize 80C (₹1.5L)</div>`;

        html += `
            <div class="tax-row">
                <span>ELSS (Tax Saver Fund)</span>
                <span>₹${(elss / 1000).toFixed(0)}k</span>
            </div>
            <div class="tax-row">
                <span>PPF / EPF</span>
                <span>₹${(ppf / 1000).toFixed(0)}k</span>
            </div>
             <div class="tax-row">
                <span>Term Insurance</span>
                <span>₹15k</span>
            </div>
        `;

        html += `<div style="font-size:0.8em; color:#888; margin-top:5px;">Projected Tax Saved: ₹${(capacity * 0.3).toFixed(0)} (Old Regime)</div>`;
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
    // 1. Get Tenure
    const tenureInput = document.getElementById("input-tenure");
    if (!tenureInput) return;

    const tenure = parseInt(tenureInput.value);
    document.getElementById("tenure-val").innerText = `${tenure} Years`;

    // 2. Assumptions (CAGR)
    // Simplified: Assume 60/30/10 split if no algo run yet
    // Equity: 12%, Debt: 7%, Gold: 8%
    const wReturn = (0.6 * 12) + (0.3 * 7) + (0.1 * 8); // ~10.1%

    const rates = {
        worst: wReturn - 4, // ~6%
        base: wReturn,      // ~10%
        best: wReturn + 4   // ~14%
    };

    // 3. Compute Future Value (FV)
    const principal = GLOBAL_STATE.income || 50000;
    const sip = (GLOBAL_STATE.alloc.savings / 100) * principal; // Monthly SIP

    // Future Value of SIP: P * [ (1+i)^n - 1 ] / i * (1+i)
    const fv = (r, years) => {
        const i = r / 12 / 100;
        const n = years * 12;
        return Math.round(sip * ((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    };

    const data = [
        fv(rates.worst, tenure),
        fv(rates.base, tenure),
        fv(rates.best, tenure)
    ];

    // 4. Render Chart
    const ctx = document.getElementById('scenarioChart');
    if (!ctx) return;

    if (scenarioChartInstance) {
        scenarioChartInstance.destroy();
    }

    scenarioChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Bear (-4%)', 'Base', 'Bull (+4%)'],
            datasets: [{
                label: `Projected Wealth (Units of ₹)`,
                data: data,
                backgroundColor: ['#e74c3c', '#f1c40f', '#2ecc71'],
                borderRadius: 4,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#666',
                        callback: function (value) { return '₹' + (value / 100000).toFixed(0) + 'L'; }
                    },
                    grid: { color: '#eee' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#333', font: { weight: 'bold' } }
                }
            }
        }
    });

    // TRIGGER DAISY CHAIN (Tax & Rebalancing)
    if (typeof renderTaxWiseWithdrawal === "function") renderTaxWiseWithdrawal();
    if (typeof updateRebalancingSchedule === "function") updateRebalancingSchedule(tenure);
}
