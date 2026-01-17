// ==========================================
// SPEND-TREK 2.0: LOGIC ENGINE (V10.1 - THE GOLDEN SPLIT)
// ==========================================

const FALLBACK_STATES = [
    "andaman-&-nicobar-islands", "andhra-pradesh", "arunachal-pradesh", "assam", "bihar",
    "chandigarh", "chhattisgarh", "dadra-&-nagar-haveli-&-daman-&-diu", "delhi", "goa",
    "gujarat", "haryana", "himachal-pradesh", "jammu-&-kashmir", "jharkhand", "karnataka",
    "kerala", "ladakh", "lakshadweep", "madhya-pradesh", "maharashtra", "manipur", "meghalaya",
    "mizoram", "nagaland", "odisha", "puducherry", "punjab", "rajasthan", "sikkim", "tamil-nadu",
    "telangana", "tripura", "uttar-pradesh", "uttarakhand", "west-bengal"
];

// CONSTANTS
const MAX_GOALS = 5;

// USER STATE
let userInputs = {
    income: 0,
    food: 0,
    transport: 0,
    rent: 0,
    shopping: 0,
    savings: 0
};
let calculatedPersona = null;

// ==========================================
// 1. INITIALIZATION
// ==========================================

function initUI() {
    console.log("🚀 Initializing UI...");

    // 1. Wait for DATA_ENGINE & Auth Button
    const authBtn = document.getElementById('auth-btn');
    if (!window.DATA_ENGINE || !authBtn) {
        console.warn("⏳ Resources (Engine/DOM) not ready. Retrying...");
        setTimeout(initUI, 200);
        return;
    }

    // 2. Auth Init (Explicit)
    if (window.CloudServices) {
        // Force re-attach listener
        authBtn.onclick = window.CloudServices.login;
        // Check session
        window.CloudServices.init();
    }

    // 3. Input Listeners
    // Explicitly bind the init button
    const initBtn = document.getElementById('btn-splash-init');
    if (initBtn) {
        initBtn.addEventListener('click', (e) => {
            console.log("Button Clicked via Listener");
            goToInput();
        });
        initBtn.style.pointerEvents = "auto";
        initBtn.style.cursor = "pointer";
    }

    document.getElementById("input-age").addEventListener("change", updateGoals);
    document.getElementById("input-monthly-income").addEventListener("input", (e) => updateTotal(e, null));

    // 3. Dynamic Data
    populateStates();

    // 4. Default Goals
    setTimeout(updateGoals, 100);

    // 5. Force update total to apply 100% logic init
    updateTotal(null);
}

function populateStates() {
    let statesSource = [];

    // 1. Try Data Engine
    if (window.DATA_ENGINE && window.DATA_ENGINE.ALL_STATES) {
        statesSource = window.DATA_ENGINE.ALL_STATES;
    } else {
        console.warn("⚠️ DATA_ENGINE Missing. Switching to FALLBACK_STATES.");
        statesSource = FALLBACK_STATES;
    }

    // 2. Safety Check: DOM Element
    const select = document.getElementById('input-state');
    if (!select) {
        console.warn("DOM not ready (input-state missing). Retrying in 100ms...");
        setTimeout(populateStates, 100);
        return;
    }

    // 3. Populate
    select.innerHTML = ''; // Clear placeholder

    // Default Option
    const defaultOpt = document.createElement("option");
    defaultOpt.text = "Select State...";
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    select.appendChild(defaultOpt);

    statesSource.forEach(state => {
        const option = document.createElement("option");
        // Format: "andhra-pradesh" -> "Andhra Pradesh"
        // If fallback, it's already formatted. If data engine, it might be slug.
        // Simple check: does it contain '-'?
        let label = state;
        if (state.includes('-')) {
            label = state.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }

        option.value = state;
        option.innerText = label;
        select.appendChild(option);
    });

    console.log(`States populated: ${statesSource.length} (Source: ${window.DATA_ENGINE && window.DATA_ENGINE.ALL_STATES ? 'Engine' : 'Fallback'})`);
}

// ==========================================
// 2. CORE LOGIC (Analyze Persona)
// ==========================================

// NAVIGATION (Screen Switching)
function goToInput() {
    // UI Transitions
    const splash = document.getElementById('ui-splash');
    const input = document.getElementById('ui-input');

    if (splash) splash.classList.add('hidden');
    if (input) input.classList.remove('hidden');

    // Init Default Goals
    setTimeout(updateGoals, 100);

    // Init Ledger (GPay Style)
    setTimeout(initLedger, 50);
}

// ==========================================================
// 1. INPUT HANDLING (V4 UPGRADE: AGE & MCCs)
// ==========================================================

// A. Dynamic Goal Population (Based on Age)

// B. Real-time Slider Sum Validation & Chart Update
let spendChart = null;

const CATEGORY_COLORS = {
    groceries: '#4FC3F7',
    utilities: '#4dd0e1',
    rent: '#FF5252',
    emi: '#D32F2F', // Fixed: Added EMI color
    health: '#7E57C2',
    dining: '#F1948A',
    travel: '#FFA726',
    shopping: '#DAF7A6',
    entertainment: '#AB47BC',
    debt: '#C0392B', // Dark Red for Debt
    savings: '#FFD700'
};

// =====================================
// 1. DYNAMIC DROPDOWNS & UI
// =====================================

function updateGoals() {
    const age = document.getElementById("input-age").value;
    const container = document.getElementById("goal-pills-container");
    container.innerHTML = ""; // Clear existing

    // Map user Age Range to Data Engine Keys (Approximate mapping)
    let ageKey = "18-25"; // Default Gen Z
    if (DATA_ENGINE.GOALS_BY_AGE[age]) {
        ageKey = age;
    } else {
        if (["23-28", "29-39"].includes(age)) ageKey = "26-42"; // Millennials
        if (["40-60"].includes(age)) ageKey = "43-58"; // Gen X
    }

    // Fallback if specific key is still missing
    const goalIds = DATA_ENGINE.GOALS_BY_AGE[ageKey] || DATA_ENGINE.GOALS_BY_AGE["18-25"];

    goalIds.forEach(id => {
        const goal = DATA_ENGINE.ALL_GOALS[id];
        if (goal) {
            const pill = document.createElement("div");
            pill.className = "goal-pill";
            pill.setAttribute("data-id", goal.id);
            pill.innerText = goal.label;

            // Interaction
            pill.onclick = () => toggleGoal(pill, goal);
            pill.onmouseenter = () => showGoalPrimer(goal);
            pill.onmouseleave = hideGoalPrimer;

            container.appendChild(pill);
        }
    });

    // Auto-select first goal as default? No, let user choose.
    if (!container.innerHTML) {
        container.innerHTML = "<div style='color:#666; font-style:italic;'>No goals available for this age group.</div>";
    }
}

window.toggleGoal = function (el, goal) {
    const isSelected = el.classList.contains("selected");
    const currentSelected = document.querySelectorAll(".goal-pill.selected").length;

    if (!isSelected) {
        if (currentSelected >= MAX_GOALS) {
            // Shake visual feedback? Alert?
            alert(`You can select up to ${MAX_GOALS} goals.`);
            return;
        }
        el.classList.add("selected");
    } else {
        el.classList.remove("selected");
    }
};

window.showGoalPrimer = function (goal) {
    const primerBox = document.getElementById("goal-primers");
    if (primerBox) primerBox.innerText = `${goal.label}: ${goal.primer || "No details."} (Cost: ${goal.cost})`;
}

window.hideGoalPrimer = function () {
    const primerBox = document.getElementById("goal-primers");
    if (primerBox) primerBox.innerText = "Hover over a goal to see details.";
}

function initChart() {
    const ctx = document.getElementById('spendChart').getContext('2d');

    // Register DataLabels if available
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }

    spendChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(CATEGORY_COLORS).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
            datasets: [{
                data: [15, 5, 30, 5, 10, 10, 10, 5, 0, 10], // Added 0 for debt default
                backgroundColor: Object.values(CATEGORY_COLORS),
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            onClick: (e, elements) => {
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const keys = Object.keys(CATEGORY_COLORS);
                    const targetId = keys[index];

                    const sliderGroup = document.getElementById(`slider-${targetId}`).closest('.slider-group');
                    if (sliderGroup) {
                        sliderGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Trigger highlight animation
                        sliderGroup.classList.remove('highlight-pulse');
                        void sliderGroup.offsetWidth; // Trigger reflow
                        sliderGroup.classList.add('highlight-pulse');
                    }
                }
            },
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ` ${context.label}: ${context.raw}%`;
                        }
                    },
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    titleFont: { family: 'Orbitron', size: 14 },
                    bodyFont: { family: 'Rajdhani', size: 14 }
                },
                datalabels: {
                    color: '#fff',
                    font: { size: 16 },
                    formatter: function (value, context) {
                        // Find key
                        const key = Object.keys(CATEGORY_COLORS)[context.dataIndex];
                        // Find icon from EXPENSE_CATEGORIES
                        const cat = EXPENSE_CATEGORIES.find(c => c.id === key);
                        return value > 3 ? (cat ? cat.icon : '') : ''; // Only show if > 3%
                    },
                    anchor: 'center',
                    align: 'center',
                    offset: 0
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

// =====================================
// LEDGER LOGIC (GPAY STYLE)
// =====================================

const EXPENSE_CATEGORIES = [
    { id: 'groceries', name: 'Groceries', type: 'Needs', val: 15, icon: '🥦' },
    { id: 'utilities', name: 'Utilities', type: 'Needs', val: 5, icon: '💡' },
    { id: 'rent', name: 'Rent', type: 'Needs', val: 20, icon: '🏠' },
    { id: 'emi', name: 'Loan EMIs', type: 'Needs', val: 10, icon: '🏦' },
    { id: 'health', name: 'Health', type: 'Needs', val: 5, icon: '💊' },
    { id: 'dining', name: 'Dining Out', type: 'Wants', val: 10, icon: '🍕' },
    { id: 'travel', name: 'Travel', type: 'Wants', val: 10, icon: '✈️' },
    { id: 'shopping', name: 'Shopping', type: 'Wants', val: 10, icon: '🛍️' },
    { id: 'entertainment', name: 'Entertainment', type: 'Wants', val: 5, icon: '🎬' },
    { id: 'debt', name: 'Credit Card / Debt', type: 'Needs', val: 0, icon: '💳' },
    { id: 'savings', name: 'Savings & Investments', type: 'Savings', val: 10, icon: '💰' }
];

window.initLedger = function () {
    console.log("Initializing Ledger...");
    const container = document.getElementById('transaction-ledger');
    if (!container) return;

    container.innerHTML = '';

    EXPENSE_CATEGORIES.forEach(cat => {
        let tagClass = `tag-${cat.type.toLowerCase()}`;

        let row = document.createElement('div');
        row.className = 'txn-row';
        row.id = `row-${cat.id}`;
        // Click to toggle expansion
        row.onclick = (e) => toggleTxnRow(e, cat.id);

        row.innerHTML = `
            <div class="txn-header">
                <div class="txn-left">
                    <div class="txn-icon">${cat.icon}</div>
                    <div class="txn-info">
                        <div class="txn-name">${cat.name}</div>
                        <div class="txn-tag ${tagClass}">${cat.type}</div>
                    </div>
                </div>
                <div class="txn-right">
                    <div class="txn-amount" id="amt-${cat.id}">₹0</div>
                    <div class="txn-pct" id="val-${cat.id}">${cat.val}%</div>
                </div>
            </div>
            <div class="txn-expand" onclick="event.stopPropagation()">
                <label style="margin-top:10px; display:block; color:#888; font-size:0.8em;">ADJUST ALLOCATION</label>
                <input type="range" id="slider-${cat.id}" min="0" max="100" value="${cat.val}" 
                       oninput="updateTotal(event, '${cat.id}')">
            </div>
        `;
        container.appendChild(row);
    });

    // Perform initial calculation
    updateTotal(null);
}

window.toggleTxnRow = function (e, id) {
    const row = document.getElementById(`row-${id}`);
    const isActive = row.classList.contains('active');

    // Collapse all others? Yes, for cleaner UI.
    document.querySelectorAll('.txn-row').forEach(r => r.classList.remove('active'));

    if (!isActive) {
        row.classList.add('active');
    }
}

window.updateTotal = function (event, manualId) {
    const income = parseFloat(document.getElementById("input-monthly-income").value) || 0;

    // If event comes from manual slider input, enforce 100% Cap
    if (manualId) {
        let slider = document.getElementById(`slider-${manualId}`);
        let currentVal = parseInt(slider.value) || 0;

        // Calculate sum of ALL OTHER sliders
        let othersTotal = 0;
        const ids = EXPENSE_CATEGORIES.map(c => c.id);
        ids.forEach(id => {
            if (id !== manualId) {
                const s = document.getElementById(`slider-${id}`);
                othersTotal += s ? (parseInt(s.value) || 0) : 0;
            }
        });

        // Strict Cap Logic
        if (othersTotal + currentVal > 100) {
            currentVal = 100 - othersTotal;
            slider.value = currentVal; // Snap back
        }

        const valSpan = document.getElementById(`val-${manualId}`);
        if (slider && valSpan) {
            valSpan.innerText = slider.value + '%';
        }
    }

    // Aggregate Data
    let total = 0;
    let chartValues = [];
    const ids = EXPENSE_CATEGORIES.map(c => c.id);

    ids.forEach(id => {
        const slider = document.getElementById(`slider-${id}`);
        // If slider doesn't exist (e.g. error), fallback to default
        const val = slider ? parseInt(slider.value) : 0;

        total += val;
        chartValues.push(val); // Chart expects array of numbers in specific order

        // Update Calculated Amount
        const amtSpan = document.getElementById(`amt-${id}`);
        if (amtSpan) {
            const amt = (income * val) / 100;
            amtSpan.innerText = "₹" + amt.toLocaleString('en-IN');
        }

        // Ensure percent text is synced (for init pass)
        const valSpan = document.getElementById(`val-${id}`);
        if (valSpan) valSpan.innerText = val + '%';
    });

    // Update Total Display
    const display = document.getElementById("total-display");
    if (display) {
        if (total === 100) {
            display.innerHTML = `TOTAL: <span style="color:#2ecc71">100%</span> (LOCKED)`;
            display.style.borderColor = "#2ecc71";
            display.style.boxShadow = "0 0 10px rgba(46, 204, 113, 0.2)";
        } else {
            const remaining = 100 - total;
            // Warn if over 100
            let color = total > 100 ? '#e74c3c' : '#FFD700';
            display.innerHTML = `TOTAL: <span style="color:${color}">${total}%</span> (${remaining}% REMAINING)`;
            display.style.borderColor = color;
            display.style.boxShadow = "none";
        }
    }

    // Update Chart
    if (!spendChart) {
        initChart();
    } else {
        spendChart.data.datasets[0].data = chartValues;
        spendChart.update('none');
    }
}

// C. The V4 Analysis Trigger
window.analyzeProfile = function () {
    // 1. Gather Inputs
    const ageGroup = document.getElementById("input-age").value;

    // V10.1 Multi-Goal Collection
    const goalPills = document.querySelectorAll(".goal-pill.selected");
    const goalIds = Array.from(goalPills).map(p => p.getAttribute("data-id"));

    if (goalIds.length === 0) {
        alert("ACCESS DENIED: Please select at least one Financial Goal.");
        return;
    }

    // Legacy "goal" string for simple logic checks (use the first one)
    const goal = goalIds[0];
    const income = parseInt(document.getElementById("input-monthly-income").value);

    // Sliders
    const s_groc = parseInt(document.getElementById("slider-groceries").value);
    const s_util = parseInt(document.getElementById("slider-utilities").value);
    const s_rent = parseInt(document.getElementById("slider-rent").value);
    const s_emi = parseInt(document.getElementById("slider-emi").value) || 0; // Fix: Added EMI
    const s_health = parseInt(document.getElementById("slider-health").value);
    const s_dine = parseInt(document.getElementById("slider-dining").value);
    const s_trav = parseInt(document.getElementById("slider-travel").value);
    const s_shop = parseInt(document.getElementById("slider-shopping").value);
    const s_ent = parseInt(document.getElementById("slider-entertainment").value);
    const s_debt = parseInt(document.getElementById("slider-debt").value);
    const s_save = parseInt(document.getElementById("slider-savings").value);

    const total = s_groc + s_util + s_rent + s_emi + s_health + s_dine + s_trav + s_shop + s_ent + s_debt + s_save;

    if (total !== 100) {
        alert(`Validation Error: Total allocation is ${total}%. Please adjust to exactly 100%.`);
        return;
    }

    // 2. AGGREGATE TO "NWS"
    const needs = s_groc + s_util + s_rent + s_emi + s_health;
    const wants = s_dine + s_trav + s_shop + s_ent;
    const savings = s_save;
    // Debt is separate but we track it. In older logic debt might be part of needs/wants, but here it's its own vector for Jethalal check.

    // 3. Switch Screen
    document.getElementById("ui-input").classList.add("hidden");
    document.getElementById("ui-processing").classList.remove("hidden");

    // 4. Processing Animation (Gokuldham Style)
    const logs = document.getElementById("console-output");
    if (logs) {
        logs.innerHTML = '';
        const constructionMsgs = [
            `> [Abdul's Shop]: Stock Check: ${document.getElementById("input-state").value}...`,
            `> [Bhide]: Tuition Fees Analyzed...`,
            `> [Jethalal]: Gada Electronics Profit Index: Calculated...`,
            `> [Popatlal]: "Duniya hila dunga!" (Risk Profile Adjusted)...`,
            `> [Tapu Sena]: Cricket Fund Allocation...`,
            `> [Madhavi]: Aachar & Papad Returns projected...`,
            `> [Sodhi]: "Party Sharty" Fund reserved...`,
            `> [Taarak]: Mehta Sahab's Wisdom applied...`,
            `> [Iyer]: Rocket 🚀 Science applied to Portfolio...`,
            `> [Dr. Hathi]: "Sahi Baat Hai" (Validation Complete)...`,
            `> [Bagha]: "Jaisi jiski soch" (Persona Mapped)...`,
            `> [Nattu Kaka]: Salary Increment Predicted...`
        ];

        let i = 0;
        const progressBar = document.getElementById("proc-bar");
        if (progressBar) progressBar.style.width = "0%";

        const interval = setInterval(() => {
            if (i >= constructionMsgs.length) {
                clearInterval(interval);

                // Final Success Message
                logs.innerHTML += `<div style="color:#2ecc71; margin-top:10px;">> SOCIETY MEETING ADJOURNED. RESULT APPROVED.</div>`;
                const consoleDiv = document.getElementById("console-output");
                if (consoleDiv) consoleDiv.scrollTop = consoleDiv.scrollHeight;

                setTimeout(() => {
                    try {
                        // Pass ALL granular inputs + Prescription + Goal IDs
                        // NOTE: Prescription is NULL here because we calculate it inside calculateAndShowResult (or it calls backend)
                        // Actually, calculateAndShowResult calls the backend which returns the prescription.
                        calculateAndShowResult(needs, wants, savings, goalIds, income, ageGroup, {
                            shop: s_shop, dine: s_dine, trav: s_trav, ent: s_ent, health: s_health, debt: s_debt
                        }, null);
                    } catch (e) {
                        if (window.CrashReporter) window.CrashReporter.logError("LOGIC_FAIL", { message: e.message });
                        alert("Logic Failed: " + e.message);
                    }
                }, 800);
            } else {
                logs.innerHTML += `<div>${constructionMsgs[i]}</div>`;
                const consoleDiv = document.getElementById("console-output");
                if (consoleDiv) consoleDiv.scrollTop = consoleDiv.scrollHeight;

                if (progressBar) {
                    const pct = ((i + 1) / constructionMsgs.length) * 100;
                    progressBar.style.width = pct + "%";
                }
                i++;
            }
        }, 300); // Faster animation (300ms) for better UX
    } else {
        // Fallback if no log div
        calculateAndShowResult(needs, wants, savings, goalIds, income, ageGroup, {
            shop: s_shop, dine: s_dine, trav: s_trav, ent: s_ent, health: s_health, debt: s_debt
        }, null);
    }
}

// ==========================================================
// 2. THE LOGIC BRAIN (V10.1: THE GOLDEN SPLIT)
// ==========================================================
// ==========================================================
// 2. THE LOGIC BRAIN (V10.1: THE GOLDEN SPLIT)
// ==========================================================
function calculateAndShowResult(needs, wants, savings, goals, income, ageGroup, granular, prescription) {

    // 1. Rule-Based Logic (Fallback & Baseline)
    const state = document.getElementById("input-state").value;
    const personaRes = FORENSICS_ENGINE.determinePersona(DATA_ENGINE, state, ageGroup, needs, wants, savings, goals, granular, granular.debt || 0);

    let personaKey = personaRes.key;
    let logicLog = personaRes.log;
    let isAI = false;

    // 2. AI OVERRIDE (Try Python Backend)
    // We wrap this in an IIFE or similar, but since we are inside a function, let's try a quick fetch if we can.
    // However, fetch is async. We need to handle the UI update AFTER fetch.

    const runUIUpdate = (finalPersona, aiSource = false) => {
        // SAVE STATE
        window.latestAnalysisResult = {
            personaKey: finalPersona,
            goals: goals,
            income: income,
            age: ageGroup
        };
        // Continue rendering...
        // Continue rendering...
        renderResultScreen(finalPersona, aiSource, logicLog, prescription, needs, wants, savings, granular, ageGroup, state);
    };

    // Construct Payload
    const aiPayload = {
        age_group: ageGroup,
        state: state,
        income: income,
        needs_pct: needs,
        wants_pct: wants,
        savings_pct: savings
    };

    fetch("https://gokuldham-backend.onrender.com/analyze/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload)
    })
        .then(response => response.json())
        .then(data => {
            console.log("🧠 AI Brain Response:", data);
            if (data.persona && data.persona !== "unknown") {
                const aiPersona = data.persona.toLowerCase();

                // --- CHAIN REACTION: FETCH PRESCRIPTION ---
                // We need to calculate inputs for the Prescription Model
                // 1. Risk Tolerance (Heuristic Mapping)
                let riskScore = 2; // Moderate
                if (["jethalal", "babita", "roshan", "daya", "tapu"].includes(aiPersona)) riskScore = 3;
                if (["bhide", "popatlal", "champaklal", "abdul"].includes(aiPersona)) riskScore = 1;

                // 2. Horizon (Average of selected goals)
                let totalYears = 0;
                let validGoals = 0;
                goals.forEach(gid => {
                    const g = DATA_ENGINE.ALL_GOALS[gid];
                    if (g) {
                        if (g.horizon.includes("Short")) totalYears += 2;
                        else if (g.horizon.includes("Long")) totalYears += 15;
                        else totalYears += 5;
                        validGoals++;
                    }
                });
                const avgHorizon = validGoals > 0 ? Math.round(totalYears / validGoals) : 5;

                const presPayload = {
                    age: parseInt(ageGroup.split("-")[0]) || 30, // Approx start age
                    income: income,
                    horizon_years: avgHorizon,
                    risk_tolerance: riskScore
                };

                fetch("https://gokuldham-backend.onrender.com/analyze/prescription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(presPayload)
                })
                    .then(res => res.json())
                    .then(presData => {
                        console.log("💊 AI Prescription Response:", presData);

                        // OVERRIDE ALLOCATION IN EXISTING PRESCRIPTION OBJECT
                        // We modify the 'prescription' object passed from strict mode rules
                        if (prescription) {
                            prescription.allocation.equity = presData.equity;
                            prescription.allocation.debt = presData.debt;
                            prescription.allocation.gold = presData.gold;
                            prescription.allocation.cash = 0; // Model didn't predict cash
                            prescription.allocation.reco = `AI Generated Strategy (${presData.confidence})`;

                            // Recalculate Projections with new Equity?
                            // (Optional, simpler to just update allocation for now)
                        }

                        runUIUpdate(aiPersona, true);
                    })
                    .catch(e => {
                        console.warn("⚠️ AI Prescription Failed. Using Matrix.", e);
                        runUIUpdate(aiPersona, true); // Still use AI Persona
                    });

            } else {
                runUIUpdate(personaKey, false);
            }
        })
        .catch(err => {
            console.warn("⚠️ AI Brain Offline. Using Rule Engine.", err);
            runUIUpdate(personaKey, false);
        });
}

// 3. UI RENDERER (Separated for clarity)
function renderResultScreen(personaKey, aiSource, logicLog, prescription, needs, wants, savings, granular, ageGroup, userState) {
    if (!personaKey || personaKey === "unknown") personaKey = "mehta";

    // FETCH REAL INFLATION
    const stateInflation = (window.STATE_INFLATION && userState && window.STATE_INFLATION[userState])
        ? window.STATE_INFLATION[userState]
        : (window.MACRO_DATA ? window.MACRO_DATA.inflation_national : 6.2);

    const REAL_INFLATION_RATE = stateInflation;

    // --- A. PERSONA CONTENT ---
    let personaData = DATA_ENGINE.PERSONAS[personaKey];
    if (!personaData) {
        personaKey = 'mehta';
        personaData = DATA_ENGINE.PERSONAS['mehta'];
    }


    // Note: engineResult.effectiveSavings could be used, but UI mostly uses original savings for display.
    // The engine already handled the logic determination.

    if (!DATA_ENGINE.PERSONAS[personaKey]) personaKey = "bagha"; // Global Safety

    // --- B. FETCH DATA ---
    const persona = DATA_ENGINE.PERSONAS[personaKey];
    const astroTx = DATA_ENGINE.ASTRO_TRANSLATIONS[persona.ruler.split(" ")[0]] || "Stars align.";

    // --- C. NISM COMPLIANCE CHECK ---
    let nismKey = "mid_career";

    if (ageGroup === "18-22" || ageGroup === "22-28") {
        nismKey = "young_earner";
    }
    if (ageGroup === "40-60" || ageGroup === "60+") {
        nismKey = "pre_retirement"; // Fix: was empty block in old code
    }

    // REAL-TIME INFLATION DATA (Dynamic from State)
    // const REAL_INFLATION_RATE = 6.3; // Old hardcoded value replaced by dynamic variable above

    const rule = DATA_ENGINE.NISM_RULES[nismKey];
    let hasGap = true;
    let gapMessage = "";
    let categoryAdvice = null; // Initialize categoryAdvice here

    // ... [Rest of rendering Logic mostly stays the same, but we need to ensure variables are defined] 
    // Wait, the block I am replacing ends at 792. It covers the ENTIRE logic block. 
    // So I need to reimplement the GAP logic here or in Forensics. 
    // Forensics only did Persona and Prescription. 
    // The "Gap Analysis" (NISM check) was in script.js and Forensics Engine doesn't seem to return it?
    // Checking Forensics Engine... it returns {key, log, effectiveSavings}.
    // It DOES NOT return advice/gap messages. 
    // So I must KEEP the Gap Analysis logic here in script.js, BUT use the persona derived from engine.

    // Re-implementing the Gap Logic (it was relatively short):

    // Determine initial advice based on NISM rule
    let advice = rule.advice;
    const equityPct = (needs < 50 && wants < 30) ? 60 : 20; // Simplified estimation

    // INFLATION CHECK
    if (savings < 20 && ageGroup !== "60+") {
        advice = {
            title: `Inflation Alert (${REAL_INFLATION_RATE}%)`,
            category: "Index Funds / Equity",
            metric: `Beat ${REAL_INFLATION_RATE}%`,
            reason: `With inflation in ${userState || 'India'} at ${REAL_INFLATION_RATE}%, your cash is burning. Invest to beat it.`
        };
    } else if (nismKey === "young_earner" && equityPct < 50) {
        advice = {
            title: "Boost Your Equity Exposure!",
            category: "Equity Mutual Funds",
            metric: `Target ${equityPct}% Equity`,
            reason: "At your age, aggressive growth in equity can significantly boost long-term wealth."
        };
    }

    // Apply NISM specific gaps and messages
    const RISK_FREE_RATE = 6.67;
    const REPO_RATE = 5.25;

    // Opportunity Cost Logic
    if (savings >= 10 && savings < 30 && nismKey === "young_earner") {
        advice = {
            title: `Opportunity Cost Alert`,
            category: "Fixed Income Benchmarking",
            metric: `Beat ${RISK_FREE_RATE}%`,
            reason: `Risk-Free Rate is ${RISK_FREE_RATE}%. Ensure your 'Safe' money matches this. Don't let it rot in 3% Savings Accounts.`
        };
    } else if (needs > 70) {
        const estLoanRate = REPO_RATE + 3.5;
        advice = {
            title: `Debt Watch (Repo @ ${REPO_RATE}%)`,
            category: "Debt Management",
            metric: `Cost > ${estLoanRate}%`,
            reason: `Repo Rate is ${REPO_RATE}%, so loans cost ~${estLoanRate}%. Paying debt is a guaranteed ${estLoanRate}% return.`
        };
    }

    if (nismKey === "young_earner" && savings < 20) {
        gapMessage = "⚠️ NISM ALERT: You are under-investing. At your age, compound is everything.";
        categoryAdvice = advice;
    } else if (nismKey === "pre_retirement" && savings < 30 && goal === "retirement") {
        gapMessage = "⚠️ CRITICAL SHORTFALL: Your savings rate is too low for retirement.";
        categoryAdvice = advice;
    } else {
        let aligned = false;
        if (personaKey === "popatlal" && goal === "health_cover") aligned = true;
        if (personaKey === "bhide" && goal === "safety") aligned = true;
        if (personaKey === "jethalal" && goal === "wealth") aligned = true;

        if (aligned) {
            hasGap = false;
            gapMessage = "You are on track. Your persona matches your goal.";
        } else {
            categoryAdvice = getCategoryAdvice(personaKey, goal, savings);
            const goalLabel = (DATA_ENGINE.ALL_GOALS[goal] && DATA_ENGINE.ALL_GOALS[goal].label) ? DATA_ENGINE.ALL_GOALS[goal].label : goal.toUpperCase();
            gapMessage = `GAP DETECTED: Behavior (${persona.name}) != Goal (${goalLabel}).`;
        }
    }

    // --- NEW: Client-Side Allocation Logic ---
    prescription = null;
    try {
        const goalsSelected = selectedGoalPills.length > 0 ? selectedGoalPills : [goal]; // Fallback
        prescription = calculateBlendedAllocation(goalsSelected, persona);
    } catch (e) {
        console.warn("Allocation Logic Failed:", e);
    }

    // Function to Calculate Allocation Locally
    function calculateBlendedAllocation(goalIds, persona) {
        // Simplified Logic: Pick the 'heaviest' goal or just the first one for V2
        // In V3, we can average them. For now, let's take the first goal.
        const mainGoalId = goalIds[0];
        const goalData = DATA_ENGINE.ALL_GOALS[mainGoalId] || DATA_ENGINE.ALL_GOALS["FG006"]; // Default FIRE

        const horizonStr = goalData.horizon; // "Short", "Long", "Medium-Long"
        let horizon = "MEDIUM";
        if (horizonStr.includes("Short")) horizon = "SHORT";
        if (horizonStr.includes("Long")) horizon = "LONG";

        // Infer Risk
        let risk = "MODERATE";
        if (persona.traits.includes("High Risk")) risk = "AGGRESSIVE";
        if (persona.traits.includes("Risk Averse")) risk = "CONSERVATIVE";

        // Criticality Override (Rule 2a)
        if (goalData.priority === "Critical" && risk === "AGGRESSIVE") {
            risk = "MODERATE"; // Safety first
        }

        // Lookup Rule
        const logicKey = `${horizon}-${risk}`;
        const rule = DATA_ENGINE.GOAL_ALLOCATION_MATRIX[logicKey] || DATA_ENGINE.GOAL_ALLOCATION_MATRIX["MEDIUM-MODERATE"];

        // Calculate Averages for Display
        const equity = Math.round((rule.equity[0] + rule.equity[1]) / 2);
        const debt = Math.round((rule.fixedDeposit[0] + rule.fixedDeposit[1]) / 2); // Map FD to Debt
        const gold = Math.round((rule.gold[0] + rule.gold[1]) / 2);
        let liquid = 100 - (equity + debt + gold);
        if (liquid < 0) liquid = 0; // Clamp

        // SIP Calculation
        // Assuming corpus is middle of cost range (e.g., "50-100L" -> 75L)
        // This is a naive parser for now.
        const sipAmount = (stateAtv * 20); // Placeholder logic: 20x average transaction value

        return {
            goal: goalData,
            horizon: horizon,
            risk: risk,
            allocation: {
                equity: equity,
                debt: debt + liquid, // Combine FD + Liquid for simple Chart
                gold: gold,
                reco: `${rule.funds[0]} + ${rule.funds[1]}`
            },
            projections: {
                years: horizon === "SHORT" ? 3 : (horizon === "LONG" ? 15 : 7),
                projected_corpus: sipAmount * 12 * (horizon === "SHORT" ? 3 : 10) * 1.5, // Rough compounded
                monthly_sip: sipAmount,
                inflation_rate: REAL_INFLATION_RATE
            }
        };
    }

    // Build Prescription HTML if available
    let solutionHTML = '';

    if (prescription) {
        solutionHTML = `
                <div class="solution-section">
                    <div class="result-window-v6">
                        <div class="col-logic" style="width:100%">
                            <div class="logic-header">FINANCIAL PRESCRIPTION</div>
                            
                            <div class="rx-card">
                                <div class="rx-row">
                                    <span class="rx-label">GOAL</span>
                                    <span class="rx-val highlight">${prescription.goal.label}</span>
                                </div>
                                <div class="rx-row">
                                    <span class="rx-label" title="Based on Goal Horizon & Risk Profile">STRATEGY</span>
                                    <span class="rx-val">${prescription.horizon} TERM / ${prescription.risk} RISK</span>
                                </div>
                                
                                <div class="rx-chart-row">
                                    <!-- CSS Conic Gradient Pie -->
                                    <div class="rx-pie" style="background: conic-gradient(
                                        #2ecc71 0% ${prescription.allocation.equity}%, 
                                        #3498db ${prescription.allocation.equity}% ${prescription.allocation.equity + prescription.allocation.debt}%,
                                        #f1c40f ${prescription.allocation.equity + prescription.allocation.debt}% ${prescription.allocation.equity + prescription.allocation.debt + prescription.allocation.gold}%,
                                        #95a5a6 ${prescription.allocation.equity + prescription.allocation.debt + prescription.allocation.gold}% 100%
                                    );"></div>
                                    <div class="rx-legend">
                                        <div><span class="dot" style="background:#2ecc71"></span> Equity: ${prescription.allocation.equity}%</div>
                                        <div><span class="dot" style="background:#3498db"></span> Debt: ${prescription.allocation.debt}%</div>
                                        <div><span class="dot" style="background:#f1c40f"></span> Gold: ${prescription.allocation.gold}%</div>
                                    </div>
                                </div>
                                
                                <div class="rx-reco-text">"${prescription.allocation.reco}"</div>
                            </div>

                            <div class="projection-box">
                                <div class="proj-title">PROJECTED CORPUS (${prescription.projections.years} YRS)</div>
                                <div class="proj-val">₹${prescription.projections.projected_corpus.toLocaleString('en-IN')}</div>
                                <div class="proj-sub">
                                    Based on SIP ₹${prescription.projections.monthly_sip.toLocaleString('en-IN')}/mo <br>
                                    <span style="color:#e74c3c">Inflation Rate: ${prescription.projections.inflation_rate} (Real-Time)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                `;
    } else if (hasGap && categoryAdvice) {
        // Fallback to old advice logic if prescription fails
        solutionHTML = `
                <div class="solution-section">
                    <div class="prescription-box">
                        <label>💊 FINANCIAL PRESCRIPTION</label>
                        <h3>${categoryAdvice.title}</h3>
                        <div class="pill">category: ${categoryAdvice.category}</div>
                        <p class="metric-text">${categoryAdvice.metric}</p>
                         <p style="font-size:0.9em; margin-top:10px; color:#aaa;">${categoryAdvice.reason}</p>
                    </div>
                </div>`;
    } else {
        solutionHTML = `
                <div class="solution-section">
                    <div class="prescription-box" style="border-color:#2ecc71; background:rgba(46, 204, 113, 0.05);">
                         <label>✅ STATUS CHECK</label>
                        <h3>System Aligned</h3>
                        <p>Your current spending and valid NISM guidelines match your goal.</p>
                     </div>
                </div>`;
    }

    // Inject the solutionHTML
    const finalHTML = `
                ${hasGap && categoryAdvice && !prescription ? '' : '' /* Clean spacer */}
                ${solutionHTML}
            `;

    // --- D. RENDER UI ---
    document.getElementById("ui-processing").classList.add("hidden");
    const resultScreen = document.getElementById("ui-result");
    resultScreen.classList.remove("hidden");

    let resultContainer = document.getElementById("result-card-container");
    if (!resultContainer) {
        const rc = document.createElement('div');
        rc.id = "result-card-container";
        resultScreen.appendChild(rc);
        resultContainer = rc;
    }

    resultContainer.innerHTML = `
        <div class="result-card" id="persona-passport" style="border-top: 5px solid ${persona.color}">
            <div class="card-header">
                <span class="badge" style="background:${persona.color}">ARCHETYPE: ${persona.name}</span>
                <h2>${persona.role}</h2>
                <div class="toggle-container" style="margin-top:10px;" data-html2canvas-ignore="true">
                    <label class="switch-label">Finance Talk</label>
                    <label class="switch">
                        <input type="checkbox" id="mode-toggle" onchange="toggleMode()">
                        <span class="slider round"></span>
                    </label>
                    <label class="switch-label">Astro Talk</label>
                </div>
            </div>
            
            <div class="card-body">
                <!-- Logic Log Hidden by Default for End Users -->
                <div class="logic-log-box hidden" id="debug-log" style="font-family:monospace; font-size:0.8em; color:#888; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
                    > NISM_RULE: ${nismKey.toUpperCase()} MODE <br>
                    > LOGIC: ${logicLog[0]}
                </div>

                <div class="grid-2">
                    <div class="col-left">
                        <div class="stat-box" style="text-align:center;">
                            <!-- VOXEL AVATAR IMPLEMENTATION -->
                            <img src="assets/${personaKey}.png" class="voxel-avatar" 
                                 style="width:120px; height:120px; border-radius:10px; margin-bottom:10px;">
                                 
                            <label>NATURAL BEHAVIOR</label>
                            <h3>${persona.traits[0]}</h3>
                        </div>
                         <div class="stat-box">
                            <label>RULING PLANET</label>
                            <h3 style="color:${persona.color}">${persona.ruler}</h3>
                        </div>
                    </div>
                    <div class="col-right">
                        <div id="text-finance" class="mode-text">
                            <h4>📊 Financial Reality</h4>
                            <p>"${persona.quote}"</p>
                            <p>${gapMessage}</p>
                        </div>
                        <div id="text-astro" class="mode-text hidden">
                            <h4>🔮 Cosmic Insight</h4>
                            <p>${astroTx}</p>
                            <p><strong>Remedy:</strong> ${hasGap && categoryAdvice ? "Focus on " + categoryAdvice.title + " to align your financial stars." : "Your stars are aligned. Keep exploring."}</p>
                        </div>
                    </div>
                </div>
            </div>

            ${prescription ? `
            <div class="solution-section">
                <!-- V2 PRESCRIPTION UI -->
                <div class="result-window-v6" style="padding:0; box-shadow:none; border:none; background:transparent;">
                    <div class="col-logic" style="width:100%">
                        <div class="logic-header" style="text-align:left; margin-bottom:10px; color:#2ecc71;">FINANCIAL PRESCRIPTION</div>
                        
                        <div class="rx-card" style="background:rgba(0,0,0,0.5); padding:15px; border-radius:8px; border:1px solid #333;">
                            <div class="rx-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <span class="rx-label" style="color:#888; font-size:0.8em;">GOAL</span>
                                <span class="rx-val highlight" style="color:#fff; font-weight:bold;">${prescription.goal.label}</span>
                            </div>
                            <div class="rx-row" style="display:flex; justify-content:space-between; margin-bottom:15px;">
                                <span class="rx-label" style="color:#888; font-size:0.8em;">STRATEGY</span>
                                <span class="rx-val" style="color:#2ecc71;">${prescription.horizon} TERM / ${prescription.risk} RISK</span>
                            </div>
                            
                            <div class="rx-chart-row" style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                                <div class="rx-pie" style="width:60px; height:60px; border-radius:50%; flex-shrink:0; background: conic-gradient(
                                    #2ecc71 0% ${prescription.allocation.equity}%, 
                                    #3498db ${prescription.allocation.equity}% ${prescription.allocation.equity + prescription.allocation.debt}%,
                                    #f1c40f ${prescription.allocation.equity + prescription.allocation.debt}% ${prescription.allocation.equity + prescription.allocation.debt + prescription.allocation.gold}%,
                                    #95a5a6 ${prescription.allocation.equity + prescription.allocation.debt + prescription.allocation.gold}% 100%
                                );"></div>
                                <div class="rx-legend" style="font-size:0.8em; color:#ddd;">
                                    <div><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2ecc71;margin-right:5px;"></span> Equity: ${prescription.allocation.equity}%</div>
                                    <div><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3498db;margin-right:5px;"></span> Debt: ${prescription.allocation.debt}%</div>
                                    <div><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f1c40f;margin-right:5px;"></span> Gold: ${prescription.allocation.gold}%</div>
                                </div>
                            </div>
                            
                            <div class="rx-reco-text" style="font-style:italic; color:#aaa; font-size:0.9em; border-top:1px solid #444; padding-top:10px;">
                                "${prescription.allocation.reco}"
                            </div>
                        </div>

                        <div class="projection-box" style="margin-top:15px; background:rgba(46, 204, 113, 0.1); padding:10px; border-radius:5px; border-left:3px solid #2ecc71;">
                            <div class="proj-title" style="font-size:0.75em; color:#2ecc71; letter-spacing:1px;">PROJECTED CORPUS (${prescription.projections.years} YRS)</div>
                            <div class="proj-val" style="font-size:1.5em; font-weight:bold; color:#fff; margin:5px 0;">₹${prescription.projections.projected_corpus.toLocaleString('en-IN')}</div>
                            <div class="proj-sub" style="font-size:0.7em; color:#bbb;">
                                SIP ₹${prescription.projections.monthly_sip.toLocaleString('en-IN')}/mo  •  Inflation: ${prescription.projections.inflation_rate}
                            </div>
                        </div>
                        
                        <div class="advice-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="advice-box" style="background:#222; padding:8px; border-radius:4px;">
                                <div style="font-size:0.7em; color:#f1c40f;">TAX STRATEGY</div>
                                <div style="font-size:0.8em; color:#ddd;">${prescription.tax_planning}</div>
                            </div>
                            <div class="advice-box" style="background:#222; padding:8px; border-radius:4px;">
                                <div style="font-size:0.7em; color:#3498db;">REBALANCING</div>
                                <div style="font-size:0.8em; color:#ddd;">${prescription.rebalancing_advice}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                
                <!-- TAX OPTIMIZATION UI -->
                <div style="margin-top:10px; margin-bottom:10px; padding:10px; background:rgba(255,193,7,0.1); border:1px dashed #ffc107; border-radius:6px; text-align:center;">
                     <div style="font-size:0.8em; color:#ffc107; margin-bottom:5px;">MATH LAB (EXPERIMENTAL)</div>
                     <button onclick="optimizePortfolio()" id="btn-optimize" style="background:#ffc107; color:#000; border:none; padding:8px 15px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:0.85em;">
                        ⚡ CALCULATE MAX TAX RETURNS
                     </button>
                     <div id="optimizer-result" style="display:none; margin-top:10px; text-align:left; font-size:0.85em;"></div>
                </div>
            </div>
            ` : (hasGap && categoryAdvice ? `
            <div class="solution-section">
                <div class="prescription-box">
                    <label>💊 FINANCIAL PRESCRIPTION</label>
                    <h3>${categoryAdvice.title}</h3>
                    <div class="pill">category: ${categoryAdvice.category}</div>
                    <p class="metric-text">${categoryAdvice.metric}</p>
                     <p style="font-size:0.9em; margin-top:10px; color:#aaa;">${categoryAdvice.reason}</p>
                </div>
            </div>
            ` : `
            <div class="solution-section">
                <div class="prescription-box" style="border-color:#2ecc71; background:rgba(46, 204, 113, 0.05);">
                    <label>✅ STATUS CHECK</label>
                    <h3>System Aligned</h3>
                    <p>Your current spending and valid NISM guidelines match your goal.</p>
                </div>
            </div>
            `)}
            
            <div class="action-footer" style="text-align:center; margin-top:20px; padding-top:15px; border-top:1px dashed #333;" data-html2canvas-ignore="true">
                <button onclick="goBackToInput()" class="btn-secondary" style="font-size:0.9em; padding:8px 20px; margin-right:10px; background:#555; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">
                    ⬅ Modify Inputs
                </button>
                <button onclick="toggleInspector()" class="btn-secondary" style="font-size:0.9em; padding:8px 20px; margin-right:10px; background:#ff5722; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">
                    👮 Consult Inspector
                </button>
                <button onclick="downloadPassport()" class="btn-primary" style="font-size:0.9em; padding:8px 20px;">
                    📥 Download Passport
                </button>
                <div style="margin-top:10px; font-size:0.7em; color:#666; cursor:pointer;" onclick="document.getElementById('debug-log').classList.toggle('hidden')">
                    [Debug Mode]
                </div>
                
                <!-- INSPECTOR PANEL -->
                <div id="inspector-panel" style="display:none; text-align:left; margin-top:15px; background:#1a1a1a; padding:15px; border-radius:10px; border-left:4px solid #ff5722; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="color:#ff5722; font-weight:bold; font-family:monospace;">INSPECTOR CHALU PANDEY v2.0</span>
                        <span style="font-size:0.8em; color:#666; cursor:pointer;" onclick="toggleInspector()">[CLOSE]</span>
                    </div>
                    <div id="inspector-history" style="height:200px; overflow-y:auto; font-size:0.9em; color:#ddd; margin-bottom:10px; background:#111; padding:10px; border-radius:6px; border:1px solid #333;">
                        <div style="color:#ff5722; margin-bottom:8px;"><strong>Inspector:</strong> "Swagat hai! I have analyzed your case. Ask me anything." <br><span style="font-size:0.8em; color:#666;">(e.g., 'How to save tax?', 'Is Jethalal bad?')</span></div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <input type="text" id="inspector-input" placeholder="Type your doubt..." style="flex:1; padding:10px; background:#333; border:1px solid #444; color:#fff; border-radius:4px; outline:none;" onkeypress="if(event.key==='Enter') askInspector()">
                        <button onclick="askInspector()" style="background:#2ecc71; color:#fff; border:none; padding:8px 20px; border-radius:4px; cursor:pointer; font-weight:bold;">ASK</button>
                    </div>
                </div>
            </div>
            </div>
        </div>
    `;

    // Camera Zoom Effect Removed (Voxel Mode)
}

// DOWNLOAD FUNCTION
window.downloadPassport = function () {
    const element = document.getElementById('persona-passport');

    // Visual tweak before capture (force ensure colors are right)

    html2canvas(element, {
        backgroundColor: '#000000', // Ensure dark background
        scale: 2, // Retina quality
        useCORS: true,
        logging: false
    }).then(canvas => {
        // Cloud Save (Auto-save on download)
        if (window.CloudServices) {
            window.CloudServices.save({
                persona: window.latestAnalysisResult ? window.latestAnalysisResult.personaKey : "unknown",
                income: window.latestAnalysisResult ? window.latestAnalysisResult.income : 0,
                timestamp: new Date()
            });
        }

        // Trigger download
        const link = document.createElement('a');
        link.download = `Spending-Passport-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}

// TOGGLE FUNCTION
window.toggleMode = function () {
    const isAstro = document.getElementById("mode-toggle").checked;
    if (isAstro) {
        document.getElementById("text-finance").classList.add("hidden");
        document.getElementById("text-astro").classList.remove("hidden");
    } else {
        document.getElementById("text-finance").classList.remove("hidden");
        document.getElementById("text-astro").classList.add("hidden");
    }
}

// STUB: Consult Inspector (Perplexity AI)
// --- INSPECTOR CHAT LOGIC (AI POWERED) ---
window.toggleInspector = function () {
    const panel = document.getElementById("inspector-panel");
    if (!panel) return;

    if (panel.style.display === "none") {
        panel.style.display = "block";
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
        panel.style.display = "none";
    }
}

window.askInspector = function () {
    const input = document.getElementById("inspector-input");
    const question = input.value;
    if (!question) return;

    const history = document.getElementById("inspector-history");
    history.innerHTML += `<div style="margin:8px 0;"><strong>You:</strong> ${question}</div>`;
    input.value = "Investigating...";
    input.disabled = true;

    // Use window.latestAnalysisResult as Base, but ENRICH it
    const ledgerState = EXPENSE_CATEGORIES.map(c => {
        return `${c.name}: ${c.val}% (${c.type})`;
    });

    const activeGoals = Array.from(document.querySelectorAll('.goal-pill.selected'))
        .map(p => p.innerText);

    const enrichContext = {
        ...window.latestAnalysisResult,
        ledger: ledgerState,
        active_goals: activeGoals,
        current_screen: document.querySelector('.ui-screen:not(.hidden)').id
    };

    const payload = {
        context: enrichContext,
        question: question
    };

    fetch("/api/inspector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            // Simple Markdown parsing (bolding)
            let answer = data.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            history.innerHTML += `<div style="color:#ffcc00; margin:10px 0; line-height:1.4;"><strong>Inspector:</strong> ${answer}</div>`;
            history.scrollTop = history.scrollHeight;
            input.value = "";
            input.disabled = false;
            input.focus();
        })
        .catch(e => {
            console.error(e);
            history.innerHTML += `<div style="color:red; margin:8px 0;"><strong>System:</strong> Inspector Failed. (${e.message})</div>`;
            input.value = "";
            input.disabled = false;
        });
}

// --- OPTIMIZER LOGIC ---
window.optimizePortfolio = function () {
    const btn = document.getElementById("btn-optimize");
    const container = document.getElementById("optimizer-result");

    btn.innerText = "📐 Solving Linear Equations...";
    btn.disabled = true;

    // Context from Global State
    // Risk: Heuristic based on persona
    let risk = 2;
    const persona = window.latestAnalysisResult ? window.latestAnalysisResult.personaKey : "mehta";
    if (["bhide", "popatlal"].includes(persona)) risk = 1;
    if (["jethalal", "babita"].includes(persona)) risk = 3;

    // Investment Amount: Derived from Income - Expenses
    // Approx Monthly Savings * 12 used as 'Pot' for optimization
    const income = window.latestAnalysisResult ? window.latestAnalysisResult.income : 50000;
    // Defaulting to 1L lump sum for simulation if savings unknown
    const investAmount = 100000;

    const payload = {
        investment_amount: investAmount,
        risk_profile: risk
    };

    fetch("https://gokuldham-backend.onrender.com/analyze/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            container.style.display = "block";
            container.innerHTML = `
            <div style="border-top:1px solid #555; padding-top:10px; margin-top:5px;">
                <div style="color:#fff; font-weight:bold; margin-bottom:5px;">MATH SOLVER VS STATUS QUO:</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div>
                        <div style="color:#aaa; font-size:0.8em;">OPTIMAL SPLIT (₹${investAmount / 1000}k)</div>
                        <ul style="padding-left:15px; margin:5px 0; color:#ddd;">
                            <li>ELSS: ${data.allocation["ELSS (Tax Saver Equity)"]}</li>
                            <li>PPF: ${data.allocation["PPF (Tax Saver Debt)"]}</li>
                            <li>Nifty: ${data.allocation["Nifty Index (Growth)"]}</li>
                            <li>FD: ${data.allocation["Fixed Deposit (Liquid)"]}</li>
                        </ul>
                    </div>
                    <div style="border-left:1px solid #444; padding-left:10px;">
                         <div style="color:#aaa; font-size:0.8em;">PROJECTED YIELD</div>
                         <div style="font-size:1.2em; color:#2ecc71; font-weight:bold;">₹${data.projected_return_1y.toLocaleString('en-IN')}</div>
                         <div style="font-size:0.7em; color:#888;">Post-Tax (1 Yr)</div>
                    </div>
                </div>
                <div style="font-size:0.7em; color:#ffc107; margin-top:5px;">
                    ${data.message}
                </div>
            </div>
        `;
            btn.innerText = "⚡ RE-CALCULATE";
            btn.disabled = false;
        })
        .catch(e => {
            alert("Optimizer Error: Check Backend Console");
            btn.innerText = "❌ ERROR";
            btn.disabled = false;
        });
}

function getPersonaEmoji(risk) {
    if (risk === 'survival') return '💀';
    if (risk === 'lifestyle') return '💅';
    if (risk === 'conservative') return '🐢';
    return '🚀';
}

// Helper: Gap Logic (Merged V3 + V4)
function getCategoryAdvice(personaKey, goal, savingsRate) {
    // V4 Goals
    if (goal === "debt") return DATA_ENGINE.CATEGORY_ADVICE["debt_killing"];
    if (goal === "health_cover") return DATA_ENGINE.CATEGORY_ADVICE["safety_net"]; // Expanded safety
    if (goal === "retirement") return DATA_ENGINE.CATEGORY_ADVICE["wealth_creation"];

    // V3 Fallbacks
    if (goal === "safety") return DATA_ENGINE.CATEGORY_ADVICE["safety_net"];

    // Persona Specific Overrides
    if (personaKey === "popatlal") return DATA_ENGINE.CATEGORY_ADVICE["inflation_protection"];
    if (personaKey === "babita" || personaKey === "tapu") return DATA_ENGINE.CATEGORY_ADVICE["gold_hedge"];
    if (personaKey === "jethalal") return DATA_ENGINE.CATEGORY_ADVICE["wealth_creation"];
    if (savingsRate < 10) return DATA_ENGINE.CATEGORY_ADVICE["safety_net"]; // Emergency!

    return DATA_ENGINE.CATEGORY_ADVICE["wealth_creation"];
}

// --- NAVIGATION HELPERS ---
window.goBackToInput = function () {
    document.getElementById("ui-result").classList.add("hidden");
    document.getElementById("ui-input").classList.remove("hidden");

    // Optional: Scroll to top of input
    const terminal = document.getElementById("input-terminal");
    if (terminal) terminal.scrollTop = 0;
}

window.goBackToSplash = function () {
    document.getElementById("ui-input").classList.add("hidden");
    document.getElementById("ui-splash").classList.remove("hidden");
}

// Start
window.addEventListener('DOMContentLoaded', () => {
    // 0. INTEGRATION INIT
    if (window.CrashReporter) window.CrashReporter.init();
    if (window.AnalyticsLogger) window.AnalyticsLogger.init();
    if (window.AnalyticsLogger) window.AnalyticsLogger.logEvent("app_session_start");

    initUI();
    // animate(); [Removed]
    // Force populate states again to be sure
    populateStates();
    // Force populate goals (Fix for empty dropdown)
    updateGoals();

    // Cloud Init
    if (window.CloudServices) window.CloudServices.init();

    // PERFORMANCE WARMUP: Ping Backend to wake it up on load
    fetch("https://gokuldham-backend.onrender.com")
        .then(() => console.log("🔥 Backend Warmup Successful"))
        .catch(e => console.log("❄️ Backend Cold / Offline", e));
});
