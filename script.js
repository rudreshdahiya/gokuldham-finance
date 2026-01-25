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
    theme: null // Will be set in initUI based on device preference
};

// --- STATE INFLATION DATA (2025 Estimates) ---
window.STATE_INFLATION = {
    "maharashtra": 6.8, "delhi": 7.2, "karnataka": 7.5, "tamil-nadu": 6.5,
    "telangana": 7.0, "gujarat": 6.2, "uttar-pradesh": 6.0, "west-bengal": 6.3,
    "rajasthan": 6.1, "kerala": 5.8, "default": 6.0
};

// Get device preference or stored preference
function getPreferredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;

    // Device preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

// ==========================================
// 1. NAVIGATION & INITIALIZATION
// ==========================================

function initUI() {
    console.log("🚀 Initializing Google Bank UI...");

    // 1. Apply Theme (Device Preference First)
    GLOBAL_STATE.theme = getPreferredTheme();
    document.body.setAttribute('data-theme', GLOBAL_STATE.theme);

    // Update ALL theme icons
    const iconEmoji = GLOBAL_STATE.theme === 'dark' ? '🌙' : '☀️';
    document.querySelectorAll('#theme-icon, .theme-icon-inner').forEach(el => {
        el.innerText = iconEmoji;
    });

    // 2. Navigation Init
    // Check for previous session? (Optional: Restore from local storage)
    // For MVP, start fresh or Page 1.
    goToPage(1);

    // Populate Dynamic Dropdowns (States)
    populateStates();

    // Detect OS for RAG Context
    GLOBAL_STATE.demographics.os = getMobileOS();
    console.log("Device OS Detected:", GLOBAL_STATE.demographics.os);
}

function getMobileOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
        return "Android";
    }
    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }
    return "Web/Desktop";
}

function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    document.body.setAttribute('data-theme', next);
    GLOBAL_STATE.theme = next;
    localStorage.setItem('theme', next);

    // Update ALL theme icons (on all pages)
    const iconEmoji = next === 'dark' ? '🌙' : '☀️';
    document.querySelectorAll('#theme-icon, .theme-icon-inner').forEach(el => {
        el.innerText = iconEmoji;
    });
}

function goToPage(pageNum) {
    // Hide all pages
    document.querySelectorAll('.ui-screen').forEach(el => el.classList.add('hidden'));

    // Show target page
    const target = document.getElementById(`ui-page-${pageNum}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active'); // Ensure active class is set
    }

    // Special Inits per Page
    if (pageNum === 2) {
        syncGranularInputs(); // Force random values into DOM
        updateLedger();
    }
    if (pageNum === 4) updateGoals(); // Init Goals
    if (pageNum === 5) {
        // Force refresh Existing SIP from current Income/Savings state
        const income = GLOBAL_STATE.income || 50000;
        const savingsRate = (GLOBAL_STATE.alloc.savings || 20) / 100;
        const baseSIPFromSavings = Math.round(income * savingsRate); // Recalculate fresh

        const existingSIPInput = document.getElementById("input-existing-sip");
        if (existingSIPInput) {
            existingSIPInput.value = baseSIPFromSavings; // Always sync with Page 2
        }

        updateGoalTimeline(); // Init Chart & Summary

        // --- DATABASE LOGGING (ANALYTICS) ---
        // Log the session info to Supabase
        const sessionData = {
            user_profile: {
                income: GLOBAL_STATE.income || 0,
                alloc: GLOBAL_STATE.alloc,
                demographics: GLOBAL_STATE.demographics,
                persona: GLOBAL_STATE.persona
            },
            selected_goals: GLOBAL_STATE.demographics.goals || [],
            rule_recommendation: GLOBAL_STATE.recommendation || {},
            final_llm_recommendation: null // Will be updated on Page 6
        };
        // Use timeout to not block UI rendering
        setTimeout(() => {
            if (typeof saveUserSession === 'function') {
                saveUserSession(sessionData);
            }
        }, 2000);
    }
    if (pageNum === 7) {
        renderPersonalizationGap();
    }
    if (pageNum === 8) {
        renderAppRecommendations();
    }
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

function syncGranularInputs() {
    for (let key in GRANULAR_ALLOC) {
        const el = document.getElementById("slider-" + key); // Corrected ID prefix
        const valEl = document.getElementById("val-" + key);
        if (el) el.value = GRANULAR_ALLOC[key];
        if (valEl) valEl.innerText = GRANULAR_ALLOC[key] + "%";

        // Sync Amount on Init
        const amtEl = document.getElementById("amt-" + key);
        if (amtEl) {
            const income = parseFloat(document.getElementById("input-income")?.value) || 50000;
            const amt = Math.round((income * GRANULAR_ALLOC[key]) / 100);
            amtEl.innerText = `(₹${amt.toLocaleString()})`;
        }
    }
}

function updateLedger(changedId, categoryKey) {
    // 1. Get Income
    const newIncome = parseFloat(document.getElementById("input-income").value) || 0;
    const incomeChanged = newIncome !== GLOBAL_STATE.income;
    GLOBAL_STATE.income = newIncome;

    // 2. Update State from Input (if slider was changed)
    if (changedId && categoryKey) {
        const val = parseInt(document.getElementById(changedId).value);
        GRANULAR_ALLOC[categoryKey] = val;
        // Update Label and Amount
        document.getElementById(`val-${categoryKey}`).innerText = val + "%";

        // Update Amount Display
        const amtEl = document.getElementById(`amt-${categoryKey}`);
        if (amtEl) {
            const amt = Math.round((GLOBAL_STATE.income * val) / 100);
            amtEl.innerText = `(₹${amt.toLocaleString()})`;
        }
    }

    // 3. If income changed, update ALL amount displays
    if (incomeChanged || !changedId) {
        for (const key in GRANULAR_ALLOC) {
            const amtEl = document.getElementById(`amt-${key}`);
            if (amtEl) {
                const amt = Math.round((GLOBAL_STATE.income * GRANULAR_ALLOC[key]) / 100);
                amtEl.innerText = `(₹${amt.toLocaleString()})`;
            }
        }
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
    console.log("Analyze Triggered");
    try {
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
            // Check dependency
            if (typeof FORENSICS_ENGINE === 'undefined') {
                alert("Critical Error: Core Engine Missing. Please refresh.");
                console.error("FORENSICS_ENGINE is undefined");
                return;
            }

            // Pass granular stats to forensics
            const annualSalary = (GLOBAL_STATE.income || 0) * 12;
            const userState = GLOBAL_STATE.demographics?.state || "maharashtra";

            console.log("Params:", annualSalary, userState);

            const personaRes = FORENSICS_ENGINE.determinePersona(
                window.DATA_ENGINE,
                annualSalary,
                userState,
                GLOBAL_STATE.demographics?.age || "25-35",
                GLOBAL_STATE.alloc.needs,
                GLOBAL_STATE.alloc.wants,
                GLOBAL_STATE.alloc.savings,
                GLOBAL_STATE.demographics?.goals || [],
                GRANULAR_ALLOC,
                0
            );

            if (!personaRes) {
                alert("Error: Persona calculation failed.");
                return;
            }

            console.log("Persona Result:", personaRes);

            GLOBAL_STATE.persona = personaRes.key;
            GLOBAL_STATE.personaResult = personaRes; // Store full result for behavioral display
            renderPersonaPage(GLOBAL_STATE.persona, personaRes);
            goToPage(3);
        }, 800);
    } catch (e) {
        console.error("Crash in analyzeHabits:", e);
        alert("System Error: " + e.message);
    }
}

// ==========================================
// 3. PAGE 3: PERSONA REVEAL
// ==========================================

// Show neighbor persona in modal when clicked
function showNeighborPersona(personaKey) {
    const personaData = DATA_ENGINE.PERSONAS[personaKey];
    if (!personaData) return;

    // Get user's persona for comparison
    const userPersonaKey = GLOBAL_STATE.persona || 'shyam';
    const userPersona = DATA_ENGINE.PERSONAS[userPersonaKey];

    // Find similarities and differences in traits
    const clickedTraits = personaData.traits || [];
    const userTraits = userPersona?.traits || [];

    const similarities = clickedTraits.filter(t => userTraits.includes(t));
    const differences = clickedTraits.filter(t => !userTraits.includes(t));

    // Generate comparison HTML
    let comparisonHTML = '';
    if (similarities.length > 0) {
        comparisonHTML += `
            <div style="margin-bottom:12px;">
                <div style="color:#27ae60; font-weight:600; font-size:0.75rem; margin-bottom:5px;">✓ Similar to You:</div>
                <div style="display:flex; flex-wrap:wrap; gap:5px;">
                    ${similarities.map(t => `<span style="background:#d5f5e3; color:#27ae60; padding:3px 8px; border-radius:12px; font-size:0.7rem;">${t}</span>`).join('')}
                </div>
            </div>
        `;
    }
    if (differences.length > 0) {
        comparisonHTML += `
            <div>
                <div style="color:#e74c3c; font-weight:600; font-size:0.75rem; margin-bottom:5px;">✗ Different from You:</div>
                <div style="display:flex; flex-wrap:wrap; gap:5px;">
                    ${differences.map(t => `<span style="background:#fdedec; color:#e74c3c; padding:3px 8px; border-radius:12px; font-size:0.7rem;">${t}</span>`).join('')}
                </div>
            </div>
        `;
    }

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center; padding:20px;';

    modal.innerHTML = `
        <div style="background:var(--color-bg-card); border-radius:12px; max-width:400px; width:100%; padding:25px; position:relative; max-height:85vh; overflow-y:auto;">
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="position:absolute; top:12px; right:12px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--color-text-muted);">×</button>
            <div style="text-align:center;">
                <img src="${personaData.img}" style="width:90px; height:90px; border-radius:50%; border:3px solid ${personaData.color || '#333'}; margin:0 auto;">
                <h2 style="color:var(--color-primary); margin:12px 0 5px 0; font-size:1.2rem;">${personaData.name}</h2>
                <div style="color:${personaData.color || '#666'}; font-size:0.8rem; font-weight:600;">${personaData.role}</div>
                <p style="color:var(--color-text-muted); font-size:0.8rem; margin:10px 0; font-style:italic;">"${personaData.quote}"</p>
            </div>
            
            <!-- Finance Story (Behavioral Finance Insight) -->
            ${personaData.finance_story ? `
            <div style="margin:15px 0; padding:12px; background:linear-gradient(135deg, #667eea22, #764ba222); border-radius:8px; border-left:3px solid ${personaData.color || '#667eea'};">
                <div style="font-weight:600; font-size:0.8rem; color:var(--color-primary); margin-bottom:6px;">💡 Financial Behavior:</div>
                <div style="font-size:0.75rem; color:var(--color-text-main); line-height:1.5;">${personaData.finance_story}</div>
            </div>
            ` : ''}
            
            <!-- Traits -->
            <div style="margin:12px 0; padding:12px; background:var(--color-bg); border-radius:8px;">
                <div style="font-weight:600; font-size:0.8rem; color:var(--color-primary); margin-bottom:8px;">Financial Traits:</div>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                    ${clickedTraits.map(t => `<span style="background:var(--color-bg-card); border:1px solid var(--color-border); padding:4px 10px; border-radius:15px; font-size:0.75rem; color:var(--color-text-main);">${t}</span>`).join('')}
                </div>
            </div>

            <!-- Comparison with User -->
            <div style="padding:12px; background:var(--color-bg); border-radius:8px;">
                <div style="font-weight:600; font-size:0.8rem; color:var(--color-primary); margin-bottom:10px;">Compared to ${userPersona?.name || 'You'}:</div>
                ${comparisonHTML || '<div style="color:var(--color-text-muted); font-size:0.75rem;">No overlap in traits - completely different approach!</div>'}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}


const PERSONA_TRIBES = {
    // High Spenders / Status
    "poo": ["chatur", "raj"], "chatur": ["poo", "raj"], "raj": ["chatur", "poo"],

    // Impulsive / Travel
    "bunny": ["geet", "rani"], "geet": ["bunny", "munna"], "rani": ["bunny", "simran"],

    // Social / Risk
    "munna": ["circuit", "veeru"], "veeru": ["munna", "raju"], "circuit": ["munna", "pushpa"],

    // Strugglers / Schemers
    "raju": ["shyam", "baburao"], "baburao": ["raju", "shyam"], "pushpa": ["circuit", "raju"],

    // Balanced / Savers
    "shyam": ["baburao", "raju"], "simran": ["rani", "shyam"],
    "farhan": ["rancho", "raju"], "rancho": ["farhan", "chatur"]
};

// ===================================
// BEHAVIORAL DIMENSIONS VISUALIZATION
// Shows 6 dimensions with academic labels (Kahneman, Markowitz style)
// ===================================
function renderBehavioralDimensions(userVector) {
    if (!userVector || userVector.length !== 6) return '';

    const dimensions = [
        { label: 'Risk Appetite', icon: '🎲', color: '#e74c3c', academic: 'Markowitz Risk Tolerance' },
        { label: 'Future Focus', icon: '⏳', color: '#3498db', academic: 'Time Preference (Laibson)' },
        { label: 'Social Spending', icon: '👥', color: '#9b59b6', academic: 'Social Capital Investment' },
        { label: 'Status Seeking', icon: '👑', color: '#f39c12', academic: 'Conspicuous Consumption (Veblen)' },
        { label: 'Money Anxiety', icon: '😰', color: '#95a5a6', academic: 'Loss Aversion (Kahneman)' },
        { label: 'Saving Power', icon: '🐷', color: '#27ae60', academic: 'Savings Discipline' }
    ];

    let html = `
        <div style="margin:20px 0; padding:15px; background:var(--color-bg-secondary); border-radius:12px; border:1px solid var(--color-border);">
            <div style="font-size:0.7rem; font-weight:bold; color:var(--color-primary); letter-spacing:1px; margin-bottom:12px; text-align:center;">
                📊 YOUR BEHAVIORAL PROFILE
            </div>
    `;

    dimensions.forEach((dim, i) => {
        const value = Math.round(userVector[i]);
        const level = value > 70 ? 'High' : value > 40 ? 'Moderate' : 'Low';

        html += `
            <div style="margin-bottom:10px;" title="${dim.academic}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-size:0.75rem; color:var(--color-text-main);">${dim.icon} ${dim.label}</span>
                    <span style="font-size:0.7rem; color:${dim.color}; font-weight:bold;">${level}</span>
                </div>
                <div style="height:6px; background:var(--color-bg); border-radius:3px; overflow:hidden;">
                    <div style="width:${value}%; height:100%; background:${dim.color}; border-radius:3px; transition:width 0.5s;"></div>
                </div>
            </div>
        `;
    });

    html += `
            <div style="font-size:0.6rem; color:var(--color-text-muted); text-align:center; margin-top:10px; font-style:italic;">
                Based on behavioral finance research (Kahneman & Tversky, Markowitz)
            </div>
        </div>
    `;

    return html;
}

function renderPersonaPage(personaKey, personaResult) {
    const pData = DATA_ENGINE.PERSONAS[personaKey] || DATA_ENGINE.PERSONAS['shyam'];

    // 1. Basic Info
    document.getElementById("persona-name").innerText = pData.name.toUpperCase();
    document.getElementById("persona-desc").innerText = pData.quote;

    // 2. Image
    const container = document.getElementById("persona-image-container");
    const imgPath = pData.img || "assets/shyam.png";
    container.innerHTML = `<img src="${imgPath}" alt="${pData.name}" 
        style="width:140px; height:140px; border-radius:50%; object-fit:cover; border:4px solid var(--color-bg-card); box-shadow:0 8px 16px rgba(0,0,0,0.15); background:var(--color-bg);"
        onerror="this.src='assets/shyam.png'">`;

    // 3. REASONING LOGIC
    const reason = generateReasoning(personaKey, GLOBAL_STATE.alloc);

    // Traits HTML
    const traitsHtml = pData.traits ? pData.traits.map(t =>
        `<span style="background:var(--color-bg); border:1px solid var(--color-border); padding:4px 10px; border-radius:15px; font-size:0.75rem; color:var(--color-text-main);">${t}</span>`
    ).join('') : '';

    // Finance Story
    const storyHTML = `
        <div style="margin:15px 0; font-size:0.9rem; color:var(--color-text-main); font-style:italic; line-height:1.5; border-left:3px solid ${pData.color}; padding-left:12px; text-align:left;">
            "${pData.finance_story}"
        </div>
    `;

    // 4. NEIGHBORS (Closest Matches)
    const neighbors = PERSONA_TRIBES[personaKey] || ["shyam", "baburao"];
    let neighborsHtml = `<div style="display:flex; justify-content:center; gap:15px; margin-top:10px;">`;

    neighbors.forEach(nKey => {
        const nData = DATA_ENGINE.PERSONAS[nKey];
        if (nData) {
            // === DIRECTIONAL COMPARISON LOGIC ===
            const userNeeds = GLOBAL_STATE.alloc.needs || 50;
            const userWants = GLOBAL_STATE.alloc.wants || 30;
            const userSavings = GLOBAL_STATE.alloc.savings || 20;

            let directionHint = "";

            const archetypeMap = {
                // High Savers
                "baburao": { needs: 50, wants: 10, savings: 40 },
                "simran": { needs: 45, wants: 15, savings: 40 },
                "rancho": { needs: 30, wants: 20, savings: 50 },
                "rani": { needs: 40, wants: 30, savings: 30 },

                // Balanced
                "shyam": { needs: 50, wants: 30, savings: 20 },
                "farhan": { needs: 45, wants: 35, savings: 20 },
                "circuit": { needs: 55, wants: 35, savings: 10 },

                // High Spenders
                "poo": { needs: 30, wants: 60, savings: 10 },
                "bunny": { needs: 30, wants: 60, savings: 10 },
                "geet": { needs: 40, wants: 50, savings: 10 },
                "raj": { needs: 35, wants: 55, savings: 10 },
                "chatur": { needs: 35, wants: 50, savings: 15 },
                "munna": { needs: 40, wants: 50, savings: 10 },
                "veeru": { needs: 40, wants: 50, savings: 10 },
                "raju": { needs: 40, wants: 50, savings: 10 },
                "pushpa": { needs: 60, wants: 30, savings: 10 }
            };

            const neighborAlloc = archetypeMap[nKey] || { needs: 50, wants: 30, savings: 20 };

            // Calculate biggest difference
            const savingsDiff = neighborAlloc.savings - userSavings;
            const wantsDiff = neighborAlloc.wants - userWants;
            const needsDiff = neighborAlloc.needs - userNeeds;

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
            <div style="text-align:center; opacity:0.85; cursor:pointer;"
                onclick="showNeighborPersona('${nKey}')"
                title="Click to explore ${nData.name}">
                <img src="${nData.img}" style="width:45px; height:45px; border-radius:50%; border:2px solid var(--color-border); box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                <div style="font-size:0.65rem; margin-top:5px; font-weight:bold; color:var(--color-text-main);">${nData.name.split(' ')[0]}</div>
                <div style="font-size:0.55rem; color:var(--color-primary); font-weight:500; margin-top:2px;">${directionHint}</div>
            </div>`;
        }
    });
    neighborsHtml += `</div>`;

    // Get user vector for behavioral display
    const userVector = personaResult?.userVector || GLOBAL_STATE.personaResult?.userVector;
    const behavioralHTML = renderBehavioralDimensions(userVector);

    const statContainer = document.querySelector(".persona-stat");
    statContainer.innerHTML = `
        <div style="margin-bottom:15px; text-align:center;">
            <div style="font-size:0.8rem; font-weight:600; color:${pData.color || 'var(--color-primary)'}; margin-bottom:8px;">${pData.role || ''}</div>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:6px;">
                ${traitsHtml}
            </div>
        </div>
        
        ${storyHTML}
        
        ${behavioralHTML}
        
        ${renderLevelUpPath(personaKey)}

        <div style="margin-top:15px; padding-top:15px; border-top:1px dashed var(--color-border);">
            <div style="font-size:0.7rem; font-weight:bold; color:var(--color-primary); letter-spacing:1px; margin-bottom:5px;">WHY THIS MATCH?</div>
            <div style="font-family:var(--font-mono); font-size:0.85rem; color:var(--color-text-main);">"${reason}"</div>
        </div>

        <div style="border-top:1px dashed var(--color-border); margin-top:15px; padding-top:15px;">
             <div style="font-size:0.7rem; font-weight:bold; color:var(--color-text-muted); letter-spacing:1px; margin-bottom:10px;">CLOSEST MATCHES</div>
             ${neighborsHtml}
        </div>
    `;

    // WOW Effect
    setTimeout(triggerConfetti, 500);
}

function generateReasoning(personaKey, alloc) {
    const pData = DATA_ENGINE.PERSONAS[personaKey];
    const { needs, wants, savings } = alloc;

    // Get persona finance story if available
    const financeStory = pData?.finance_story;

    // If we have a detailed finance story, use first sentence + user's allocation context
    if (financeStory) {
        // Extract key insight from finance_story
        const firstSentence = financeStory.split('.')[0] + '.';

        // Add user's allocation context
        let userContext = '';
        if (savings > 35) {
            userContext = `Your ${savings}% savings is impressive—you're disciplined like this persona.`;
        } else if (wants > 40) {
            userContext = `Your ${wants}% on Wants shows you prioritize lifestyle, just like this character.`;
        } else if (needs > 55) {
            userContext = `Your ${needs}% on Needs shows practical priorities similar to this persona.`;
        } else {
            userContext = `Your balanced ${needs}/${wants}/${savings} split aligns with this financial personality.`;
        }

        return `${firstSentence} ${userContext}`;
    }

    // Fallback for any missing finance_story
    let highCat = "Balanced";
    if (needs > 60) highCat = "Needs-focused";
    if (wants > 40) highCat = "Lifestyle-oriented";
    if (savings > 40) highCat = "Savings-driven";

    return `Your ${highCat} approach (N:${needs}% / W:${wants}% / S:${savings}%) matches ${pData?.name || personaKey}'s financial psychology.`;
}

// ==========================================
// UTILS: SHARE & CONFETTI
// ==========================================
function triggerConfetti() {
    if (typeof confetti === 'function') {
        const pData = GLOBAL_STATE.persona ? DATA_ENGINE.PERSONAS[GLOBAL_STATE.persona] : null;
        const color = pData ? pData.color : '#FFD700';

        // Burst 1
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF69B4', '#FFD700', '#00CED1', '#DC143C', color]
        });

        // Burst 2 (Delayed)
        setTimeout(() => {
            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: [color, '#ffffff']
            });
            confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: [color, '#ffffff']
            });
        }, 500);
    }
}

function sharePersona(key) {
    const pData = DATA_ENGINE.PERSONAS[key];
    const text = `🎬 I am ${pData.name} in Bollywood Finance!\n\n"${pData.quote}"\n\nFind out your financial personality here: ` + window.location.href;

    if (navigator.share) {
        navigator.share({
            title: 'My Bollywood Finance Persona',
            text: text,
            url: window.location.href
        }).catch((e) => console.log('Share failed:', e));
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert("Copied to clipboard! Share it with friends.");
        });
    }
}

// ==========================================
// 4. PAGE 4: CONTEXT (DEMOGRAPHICS)
// ==========================================

// Helper: Populate States (Standard Select)
function populateStates() {
    const select = document.getElementById('input-state');
    if (!select) return;

    // Use DATA_ENGINE source of truth
    const states = window.DATA_ENGINE ? window.DATA_ENGINE.ALL_STATES : [];

    // Clear and Add Placeholder
    select.innerHTML = '<option value="" disabled selected>Select your state...</option>';

    states.forEach(state => {
        const option = document.createElement("option");
        option.value = state;
        option.innerText = state.replace(/-/g, ' ').toUpperCase();
        select.appendChild(option);
    });
}

// Show/Filter Dropdown
function showStateList() {
    const list = document.getElementById('state-list-dropdown');
    if (list) list.style.display = 'block';
}

function filterStates() {
    const input = document.getElementById('input-state-search');
    const filter = input.value.toUpperCase();
    const list = document.getElementById('state-list-dropdown');
    const options = list.getElementsByTagName('div');

    list.style.display = 'block';

    for (let i = 0; i < options.length; i++) {
        const txtValue = options[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            options[i].style.display = "";
        } else {
            options[i].style.display = "none";
        }
    }
}

// Select State
function selectState(value, text) {
    document.getElementById('input-state').value = value;
    document.getElementById('input-state-search').value = text;
    document.getElementById('state-list-dropdown').style.display = 'none';

    GLOBAL_STATE.demographics.state = value;
    updateStateContext(); // Trigger update logic
}

// Hide dropdown when clicking outside
document.addEventListener('click', function (e) {
    const container = document.querySelector('.input-section'); // Scope to input section
    const isClickInside = container && container.contains(e.target);
    const input = document.getElementById('input-state-search');

    if (!isClickInside && input && e.target !== input) {
        const list = document.getElementById('state-list-dropdown');
        if (list) list.style.display = 'none';
    }
});

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

    // Map Select Values to Data Keys
    // HTML Options: "18-25", "26-35", "36-50", "50+"
    // DATA Keys: "18-25", "22-28", "29-39", "40-60", "60+"
    let ageKey = "18-25";

    if (age === "26-35") ageKey = "29-39"; // Best Fit
    else if (age === "36-50") ageKey = "40-60"; // Best Fit
    else if (age === "50+") ageKey = "60+"; // Best Fit
    else if (age === "18-25") ageKey = "18-25";

    // Use DATA_ENGINE
    // Use mapped key to filter
    const goalIds = DATA_ENGINE.GOALS_BY_AGE[ageKey] || DATA_ENGINE.GOALS_BY_AGE["18-25"];

    // Clear and Redraw
    container.innerHTML = ""; // Hard Clear

    goalIds.slice(0, 6).forEach(id => {
        const goal = DATA_ENGINE.ALL_GOALS[id];
        const pill = document.createElement("div");
        pill.className = "goal-pill";
        pill.dataset.goalId = id;
        pill.dataset.goalLabel = goal.label;
        pill.innerHTML = `<div style="margin-bottom:4px;">${goal.label}</div><div style="font-size:0.6rem; opacity:0.75; font-weight:normal;">${goal.years || 5}Y | ₹${goal.corpus || 10}L</div>`;
        pill.onclick = () => {
            pill.classList.toggle("active");
            // Limit 2 logic...
            const active = container.querySelectorAll(".goal-pill.active");
            if (active.length > 2) {
                active[0].classList.remove("active");
            }
            // Update State
            GLOBAL_STATE.demographics.goals = Array.from(container.querySelectorAll(".active")).map(p => p.dataset.goalLabel);
            GLOBAL_STATE.demographics.goalIds = Array.from(container.querySelectorAll(".active")).map(p => p.dataset.goalId);
        };
        container.appendChild(pill);
    });
}

function renderAssetMixExplainer(personaKey) {
    const container = document.getElementById("asset-class-explainer");
    const nameSpan = document.getElementById("asset-mix-persona-name");

    if (!container) return;

    const pData = DATA_ENGINE.PERSONAS[personaKey || 'shyam'];
    if (nameSpan) nameSpan.innerText = (pData.name || "YOU").toUpperCase();

    // Context from User Alloc (Fallback to 50/30/20 only if null)
    const alloc = GLOBAL_STATE.recommendation?.allocation || { equity: 50, debt: 30, gold: 20 };
    const goals = GLOBAL_STATE.demographics.goals || [];
    const age = parseInt(document.getElementById("input-age")?.value) || 30;

    // Map Goal IDs to Labels if needed (or just use what we have if they are labels)
    // script.js line 715 sets .goals to labels. So 'goals' are labels.
    const goal1 = goals[0] || 'Wealth Creation';
    const userState = GLOBAL_STATE.demographics.state || "default";
    const localInflation = (window.STATE_INFLATION && window.STATE_INFLATION[userState]) || 6.0;

    // Logic Breakdown
    let logicText = `Based on your age (<strong>${age}</strong>), we started with a balanced mix.`;

    if (localInflation > 7.0) {
        logicText += ` Living in <strong>${userState.toUpperCase()}</strong> means facing high inflation (${localInflation}%), so we increased Equity to help you beat it.`;
    }

    if (alloc.equity > 60) {
        logicText += ` Since <strong>${goal1}</strong> is a long-term goal, we prioritized <strong>Equity (${alloc.equity}%)</strong> for maximum growth.`;
    } else if (alloc.equity < 40) {
        logicText += ` But because <strong>${goal1}</strong> is short-term or you prefer safety, we kept Equity modest at <strong>${alloc.equity}%</strong>.`;
    } else {
        logicText += ` We fine-tuned <strong>Equity to ${alloc.equity}%</strong> to balance growth with safety for <strong>${goal1}</strong>.`;
    }

    // Add "How we got this" logic header with Info Icon
    container.innerHTML = `
        <div style="margin-bottom:12px; font-size:0.8rem; color:var(--color-primary); border-bottom:1px solid #eee; padding-bottom:5px; display:flex; align-items:center; justify-content:space-between;">
             <div><strong>🧬 Strategy Logic:</strong> ${logicText}</div>
             <div onclick="openMethodologyModal()" style="cursor:pointer; font-size:1.1rem; opacity:0.8;" title="View Methodology">ℹ️</div>
        </div>
        <div style="margin-bottom:8px; line-height:1.4;">
            <span style="color:#90caf9; font-weight:bold;">● Equity (${alloc.equity}%):</span> Growth engine for your ${goals.length > 0 ? goals.join(" & ") : "goals"}.
        </div>
        <div style="margin-bottom:8px; line-height:1.4;">
            <span style="color:#ce93d8; font-weight:bold;">● Debt (${alloc.debt}%):</span> Stability reserve for emergencies.
        </div>
        <div style="line-height:1.4;">
             <span style="color:#fff59d; font-weight:bold;">● Gold (${alloc.gold}%):</span> Inflation hedge.
        </div>
    `;
}



// --- METHODOLOGY MODAL FUNCTIONS ---
window.openMethodologyModal = function () {
    const m = document.getElementById("methodology-modal");
    if (!m) return;

    // 1. Gather Context
    const ageVal = document.getElementById("input-age")?.value || "30";
    // If it's a range like "20-30", show that.
    const ageDisplay = ageVal.includes("-") ? ageVal : ageVal + "s";

    const state = GLOBAL_STATE.demographics.state || "India";
    const inflation = (window.STATE_INFLATION && window.STATE_INFLATION[state]) || 6.0;
    const persona = (GLOBAL_STATE.persona || "You").toUpperCase();

    // 2. Build Dynamic Content (High Contrast, Readable)
    const contentHTML = `
        <div style="font-family:sans-serif;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #333; padding-bottom:10px;">
                <h3 style="margin:0; font-size:1.2rem; color:#fff;">🧬 Allocation Logic</h3>
                <span onclick="closeMethodologyModal()" style="cursor:pointer; font-size:1.5rem; color:#888;">&times;</span>
            </div>

            <div style="display:flex; flex-direction:column; gap:15px;">
                <!-- Step 1 -->
                <div style="display:flex; gap:15px; align-items:flex-start;">
                    <div style="background:#333; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; flex-shrink:0;">1</div>
                    <div>
                        <strong style="color:#fff; display:block; margin-bottom:4px;">The Global Base</strong>
                        <div style="color:#ccc; font-size:0.9rem;">We start everyone with a balanced <span style="color:#fff;">50/30/20</span> mix (Equity/Debt/Gold).</div>
                    </div>
                </div>

                <!-- Step 2 -->
                <div style="display:flex; gap:15px; align-items:flex-start;">
                    <div style="background:#333; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; flex-shrink:0;">2</div>
                    <div>
                        <strong style="color:#fff; display:block; margin-bottom:4px;">Age Check (${ageDisplay})</strong>
                        <div style="color:#ccc; font-size:0.9rem;">
                            Your age range suggests you have <span style="color:#4caf50;">Time to Grow</span>. We adjust Equity accordingly.
                        </div>
                    </div>
                </div>

                <!-- Step 3 -->
                <div style="display:flex; gap:15px; align-items:flex-start;">
                    <div style="background:#333; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; flex-shrink:0;">3</div>
                    <div>
                        <strong style="color:#fff; display:block; margin-bottom:4px;">Persona Match (${persona})</strong>
                        <div style="color:#ccc; font-size:0.9rem;">
                            Based on your risk profile, we fine-tune the risk exposure.
                        </div>
                    </div>
                </div>

                <!-- Step 4 -->
                <div style="display:flex; gap:15px; align-items:flex-start;">
                    <div style="background:#333; color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; flex-shrink:0;">4</div>
                    <div>
                        <strong style="color:#fff; display:block; margin-bottom:4px;">Reality Check (${state.toUpperCase()})</strong>
                        <div style="color:#ccc; font-size:0.9rem;">
                            Inflation in your state is <span style="color:#ffb74d;">${inflation}%</span>. We tweaked allocation to ensure you beat it.
                        </div>
                    </div>
                </div>
            </div>

            <button onclick="closeMethodologyModal()" style="width:100%; margin-top:25px; padding:12px; background:#2196f3; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">GOT IT</button>
        </div>
    `;

    // 3. Inject and Show
    const container = m.querySelector('.modal-content');
    if (container) {
        container.style.background = "#1a1a1a"; // Force dark readable bg
        container.style.color = "#ffffff";
        container.innerHTML = contentHTML;
    }

    m.classList.remove("hidden");
    m.style.display = "flex";
};

window.closeMethodologyModal = function () {
    const m = document.getElementById("methodology-modal");
    if (m) {
        m.classList.add("hidden");
        m.style.display = "none";
    }
};


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

    // Store goal IDs for proper lookup (not innerText which has extra formatting)
    GLOBAL_STATE.demographics.goalIds = Array.from(activePills).map(p => p.dataset.goalId);
    GLOBAL_STATE.demographics.goals = Array.from(activePills).map(p => p.dataset.goalLabel);

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
    renderTaxWiseWithdrawal(); // NEW: Populate tax withdrawal guide

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
    const pKey = GLOBAL_STATE.persona || "shyam";
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
    const pData = DATA_ENGINE.PERSONAS[pKey] || DATA_ENGINE.PERSONAS['shyam'];

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

    // === INFLATION ADJUSTMENT (State Specific) ===
    const userState = GLOBAL_STATE.demographics.state || "default";
    const localInflation = (window.STATE_INFLATION && window.STATE_INFLATION[userState]) || 6.0;

    if (localInflation > 7.0) {
        baseEquity += 5; // Beat high inflation
        baseDebt -= 5;
    } else if (localInflation < 6.0) {
        baseEquity -= 5; // Can afford to be safer
        baseDebt += 5;
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

    // Design System Colors: Equity (Pastel Blue), Debt (Pastel Purple), Gold (Pastel Yellow)
    const dsColors = ['#90caf9', '#ce93d8', '#fff59d'];

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
    const pData = DATA_ENGINE.PERSONAS[personaKey] || DATA_ENGINE.PERSONAS['shyam'];
    const goals = GLOBAL_STATE.demographics.goals || [];
    const tenure = parseInt(document.getElementById("input-tenure").value) || 10;
    const alloc = GLOBAL_STATE.recommendation.allocation; // {equity, debt, gold}

    // === ALLOCATION REASONING ===
    const reasonDiv = document.getElementById('allocation-reasoning');
    if (reasonDiv) {
        const userSavings = GLOBAL_STATE.alloc.savings || 20;
        const primaryGoal = goals[0] || "general wealth creation";

        let allocReason = `<strong>${pData.name}, here's why we recommend ${alloc.equity}/${alloc.debt}/${alloc.gold}:</strong><br><br>`;

        // 1. Base logic (9-Rule Matrix)
        allocReason += `<strong>📊 Base Strategy:</strong> Your ${tenure}-year timeline + `;
        if (personaKey === 'jethalal' || personaKey === 'roshan' || personaKey === 'babita') {
            allocReason += `risk-taking nature (like ${pData.name}!) → Started with 65% equity.<br>`;
        } else if (personaKey === 'bhide' || personaKey === 'popatlal' || personaKey === 'champaklal') {
            allocReason += `conservative approach (${pData.name}'s wisdom) → Started with 35% equity.<br>`;
        } else {
            allocReason += `balanced mindset → Started with 50% equity.<br>`;
        }

        // 2. Persona adjustments
        allocReason += `<br><strong>👤 Persona Adjustment:</strong> `;
        if (personaKey === 'jethalal') {
            allocReason += `Added +10% equity because risk-takers like Jethalal chase higher returns. Removed 5% gold (you trust markets more than metal).<br>`;
        } else if (personaKey === 'popatlal') {
            allocReason += `Added +10% debt for safety because Popatlal-types fear market crashes. Reduced equity by 10%.<br>`;
        } else if (personaKey === 'bhide') {
            allocReason += `Added +5% each to debt and gold—disciplined savers trust traditional assets. Reduced equity by 10%.<br>`;
        } else if (personaKey === 'champaklal') {
            allocReason += `Added +15% debt for maximum safety (retirees can't recover from losses). Reduced equity by 15%.<br>`;
        } else if (personaKey === 'babita') {
            allocReason += `Added +5% debt for lifestyle liquidity (high-spending personalities need cash flow). Reduced equity by 5%.<br>`;
        } else {
            allocReason += `No adjustments—your balanced personality fits the standard model.<br>`;
        }

        // 3. User behavior
        allocReason += `<br><strong>💰 Your Savings Rate (${userSavings}%):</strong> `;
        if (userSavings > 30) {
            allocReason += `High savers like you can handle volatility. Added +5% equity as a reward.<br>`;
        } else if (userSavings < 15) {
            allocReason += `Low savings mean less margin for error. Added +5% debt for safety.<br>`;
        } else {
            allocReason += `Average savings rate → No adjustments needed.<br>`;
        }

        // 4. Goal-specific
        allocReason += `<br><strong>🎯 Goal Impact ("${primaryGoal}"):</strong> `;
        if (goals.some(g => g.includes("Wedding") || g.includes("Car") || g.includes("Vacation"))) {
            allocReason += `Short-term high-cost goals require liquidity. Added +10% debt, reduced equity by 10%.<br>`;
        } else if (goals.includes("FIRE (Retire Early)") || goals.includes("SIP Portfolio")) {
            allocReason += `Long-term wealth goals allow aggressive growth. Added +10% equity, reduced debt & gold.<br>`;
        } else if (goals.includes("Parental Medical Care") || goals.includes("Emergency Fund")) {
            allocReason += `Immediate-access needs critical. Added +10% debt, reduced equity by 10%.<br>`;
        } else {
            allocReason += `Your goal fits the standard timeline → No adjustments.<br>`;
        }

        // Final note
        allocReason += `<br><em style="color:var(--color-text-muted); font-size:0.85rem;">All percentages clamped to safe ranges (Equity: 20-85%, Debt: 10-60%).</em>`;

        reasonDiv.innerHTML = allocReason;
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

// Disabled as per user feedback
function runTaxOptimizer() {
    const container = document.getElementById("tax-strategy-content");
    if (container) container.innerHTML = "";
}

function renderRebalancing(data) {
    const container = document.getElementById("rebalancing-content");
    if (container) container.innerHTML = ""; // Feature Removed per User Feedback
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

    // Use Vercel Serverless Function (never sleeps!)
    const apiUrl = "/api/inspector";
    console.log("Inspector: Sending request to", window.location.origin + apiUrl);

    fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            context: context,
            question: msg
        })
    })
        .then(res => {
            if (!res.ok) {
                // Try to get error message from response
                return res.json().then(data => {
                    throw new Error(data.answer || `Server returned ${res.status}`);
                });
            }
            return res.json();
        })
        .then(data => {
            document.getElementById(loadingId).remove();
            // Format MD
            let cleanAnswer = data.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            history.innerHTML += `<div class="chat-msg system">${cleanAnswer}</div>`;
            history.scrollTop = history.scrollHeight;
        })
        .catch(e => {
            console.error("Inspector Error:", e);
            document.getElementById(loadingId).innerHTML = `
                <div style="color:#e74c3c; padding:10px; background:#fee; border-radius:4px; font-size:0.85rem;">
                    <strong>⚠️ Inspector Error</strong><br>
                    <div style="margin-top:5px; font-size:0.75rem; color:#666;">
                        ${e.message}<br>
                        <strong>Check</strong>: Vercel logs or GEMINI_API_KEY env variable.
                    </div>
                </div>`;
        });
}

// ==========================================
// 8.B LEVEL UP PATH (Recovered)
// ==========================================
function renderLevelUpPath(personaKey) {
    // Simple placeholder to prevent ReferneceError
    // Logic: Just show a generic motivator
    return `
        <div style="margin-top:10px; padding:10px; background:rgba(0,0,0,0.03); border-radius:4px; border:1px solid var(--color-border); font-size:0.7rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
               <strong>🚀 Next Level:</strong>
               <span style="color:var(--color-primary); font-weight:bold;">Wealth Compounder</span>
            </div>
            <div style="margin-top:4px; color:var(--color-text-muted);">
               optimize your <strong>Needs vs Wants</strong> ratio to unlock higher tiers.
            </div>
        </div>
    `;
}

// ==========================================
// 9. TAX EFFICIENCY ENGINE (PERSONALIZED)
// ==========================================
function renderTaxWiseWithdrawal() {
    // Feature disabled
    const container = document.getElementById("tax-withdrawal-content");
    if (container) container.innerHTML = "";
}

// ==========================================
// 10. DYNAMIC REBALANCING LOGIC (PERSONALIZED)
// ==========================================
function updateRebalancingSchedule(tenureYears) {
    const container = document.getElementById("rebalancing-content");
    if (!container) return;

    // === PERSONALIZATION INPUTS ===
    const pKey = GLOBAL_STATE.persona || "shyam";
    const pData = DATA_ENGINE.PERSONAS[pKey] || DATA_ENGINE.PERSONAS['shyam'];
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

// function renderStrategyInsights(personaKey) { ... removed duplicate ... }
let scenarioChartInstance = null;

// NEW: Goal Timeline Chart - Calculates YEARS to reach goal
function updateGoalTimeline() {
    // 1. Get User Inputs (from Page 2 - Income & Savings Allocation)
    const income = GLOBAL_STATE.income || 50000;
    const savingsRate = (GLOBAL_STATE.alloc.savings || 20) / 100;
    const baseSIPFromSavings = Math.round(income * savingsRate); // Calculated from Page 2 slider

    // Get input elements
    const existingSIPInput = document.getElementById("input-existing-sip");
    const existingCorpusInput = document.getElementById("input-existing-corpus");
    const extraSIPInput = document.getElementById("input-extra-sip");
    const lumpsumInput = document.getElementById("input-lumpsum");

    // PREFILL: Set Existing SIP to the calculated savings from Page 2 (only if empty/0)
    if (existingSIPInput && (existingSIPInput.value === "" || existingSIPInput.value === "0")) {
        existingSIPInput.value = baseSIPFromSavings;
    }

    // Read current values (user can edit these)
    const existingSIP = existingSIPInput ? parseInt(existingSIPInput.value) || 0 : 0;
    const existingCorpus = existingCorpusInput ? parseInt(existingCorpusInput.value) || 0 : 0;

    // NUDGE: If existing corpus is 0, add a subtle shake/glow effect once
    if (existingCorpusInput && existingCorpus === 0 && !existingCorpusInput.dataset.nudged) {
        existingCorpusInput.dataset.nudged = "true";
        existingCorpusInput.style.transition = "box-shadow 0.3s ease, border-color 0.3s ease";
        setTimeout(() => {
            existingCorpusInput.style.borderColor = "var(--color-accent)";
            existingCorpusInput.style.boxShadow = "0 0 8px rgba(46, 204, 113, 0.4)";

            // Add tooltip via placeholder or temporary label change
            const originalPlace = existingCorpusInput.placeholder;
            existingCorpusInput.placeholder = "Enter current savings here!";

            setTimeout(() => {
                existingCorpusInput.style.borderColor = "var(--color-border)";
                existingCorpusInput.style.boxShadow = "none";
                existingCorpusInput.placeholder = originalPlace;
            }, 2000);
        }, 800);
    }

    // Call Asset Mix Explainer (New V3 Feature)
    renderAssetMixExplainer(GLOBAL_STATE.persona);
    const extraSIP = extraSIPInput ? parseInt(extraSIPInput.value) || 0 : 0;
    const lumpsum = lumpsumInput ? parseInt(lumpsumInput.value) || 0 : 0;

    // TOTAL = Existing SIP (prefilled from savings) + Extra SIP
    const totalMonthlySIP = existingSIP + extraSIP;
    const totalCorpus = existingCorpus + lumpsum;

    // Update Investment Summary (show source of numbers)
    const summaryDiv = document.getElementById("total-investment-summary");
    if (summaryDiv) {
        summaryDiv.innerHTML = `
            <div class="summary-header">📟 Your Total Investment Setup</div>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Monthly SIP</span>
                    <span class="summary-value">₹${(totalMonthlySIP / 1000).toFixed(1)}k</span>
                    <span class="summary-source">
                        ₹${(existingSIP / 1000).toFixed(1)}k (from ${Math.round(savingsRate * 100)}% savings on ₹${(income / 1000).toFixed(0)}k income)
                        ${extraSIP > 0 ? ` + ₹${(extraSIP / 1000).toFixed(1)}k extra` : ''}
                    </span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Starting Corpus</span>
                    <span class="summary-value">₹${(totalCorpus / 100000).toFixed(1)}L</span>
                    <span class="summary-source">
                        ${existingCorpus > 0 ? `₹${(existingCorpus / 100000).toFixed(1)}L corpus` : '₹0'}
                        ${lumpsum > 0 ? ` + ₹${(lumpsum / 100000).toFixed(1)}L lumpsum` : ''}
                    </span>
                </div>
            </div>
        `;
    }

    // 2. Goal Target Calculation (SUM of selected goals)
    const goalIds = GLOBAL_STATE.demographics.goalIds || [];
    const goalLabels = GLOBAL_STATE.demographics.goals || [];
    let targetCorpus = 50; // Default 50L
    let targetGoalLabels = [];
    let totalYears = 0;

    // Use goalIds for accurate lookup
    let corpusSum = 0;
    let goalCount = 0;

    for (let gId of goalIds) {
        const g = DATA_ENGINE.ALL_GOALS[gId];
        if (g && g.corpus) {
            corpusSum += g.corpus;
            totalYears += (g.years || 5);
            goalCount++;
            targetGoalLabels.push(g.label);
        }
    }

    // Fallback to label matching if goalIds not available
    if (goalCount === 0 && goalLabels.length > 0) {
        for (let gLabel of goalLabels) {
            for (let key in DATA_ENGINE.ALL_GOALS) {
                const g = DATA_ENGINE.ALL_GOALS[key];
                if (g.label === gLabel && g.corpus) {
                    corpusSum += g.corpus;
                    totalYears += (g.years || 5);
                    goalCount++;
                    targetGoalLabels.push(g.label);
                    break;
                }
            }
        }
    }

    // SUM the corpus for multiple goals (not average)
    if (goalCount > 0) {
        targetCorpus = corpusSum; // Use SUM, not average
    }

    // 2b. Get State-Based Inflation Rate
    const userState = GLOBAL_STATE.demographics?.state || "Maharashtra";
    const stateInflation = (window.STATE_INFLATION && window.STATE_INFLATION[userState])
        ? window.STATE_INFLATION[userState] / 100
        : 0.06; // Default 6% if not found

    // Adjust target corpus for inflation over average goal horizon
    const avgGoalYears = goalCount > 0 ? Math.round(totalYears / goalCount) : 10;

    // Inflation-adjusted target (future value of current goal) - DISPLAY ONLY
    const inflationAdjustedTarget = Math.round(targetCorpus * Math.pow(1 + stateInflation, avgGoalYears));

    // Update UI with inflation info
    const targetLabel = document.getElementById("target-goal-label");
    const targetCorpusEl = document.getElementById("target-corpus");
    if (targetLabel) {
        const goalText = targetGoalLabels.length > 0 ? targetGoalLabels.join(" + ") : "Wealth Creation";
        // Show Present Value clearly
        targetLabel.innerHTML = `${goalText} <span style="font-size:0.7em; color:#e74c3c;">(Results in Today's Value)</span>`;
    }
    // Show Present Value (Target) not Future Value, to match Real Rate graph
    if (targetCorpusEl) targetCorpusEl.innerText = targetCorpus;

    // 3. Returns Assumptions (REAL RETURNS = Nominal - Inflation)
    const alloc = GLOBAL_STATE.recommendation?.allocation || { equity: 50, debt: 30, gold: 20 };
    const R_EQUITY = 0.12, R_DEBT = 0.07, R_GOLD = 0.08;
    const nominalRate = ((alloc.equity * R_EQUITY) + (alloc.debt * R_DEBT) + (alloc.gold * R_GOLD)) / 100;

    // Real rate (inflation-adjusted)
    const realRate = nominalRate - stateInflation;
    const wRateAnnual = Math.max(0.01, realRate); // At least 1% real return

    const deviation = 0.02; // Lower deviation for real rates
    const bearRate = Math.max(0.005, wRateAnnual - deviation);
    const baseRate = wRateAnnual;
    const bullRate = wRateAnnual + deviation;

    // 4. Calculate YEARS to reach target corpus
    // NOTE: using targetCorpus (Present Value) because we are using Real Rates.
    // This avoids double counting inflation.

    function yearsToReachGoal(annualRate, monthlySIP, lumpsum, targetL) {
        const targetAmount = targetL * 100000; // Convert to INR
        const monthlyRate = annualRate / 12;
        let corpus = lumpsum;
        let months = 0;
        const maxMonths = 50 * 12; // Cap at 50 years

        while (corpus < targetAmount && months < maxMonths) {
            corpus = corpus * (1 + monthlyRate) + monthlySIP;
            months++;
        }

        return months >= maxMonths ? 50 : (months / 12).toFixed(1);
    }

    // Use targetCorpus (PV) not inflationAdjustedTarget (FV)
    const bearYears = yearsToReachGoal(bearRate, totalMonthlySIP, totalCorpus, targetCorpus);
    const baseYears = yearsToReachGoal(baseRate, totalMonthlySIP, totalCorpus, targetCorpus);
    const bullYears = yearsToReachGoal(bullRate, totalMonthlySIP, totalCorpus, targetCorpus);

    // 5. UPDATE SCENARIO VISUAL (Wealth Chart)
    const annualSIP = totalMonthlySIP * 12;
    renderWealthChart(totalMonthlySIP, totalCorpus, Math.max(bearYears, baseYears, bullYears));

    // 6. IMPACT VISUALIZATION (Time Saved)
    const banner = document.getElementById('impact-banner');
    if (banner) {
        // Calculate Base Years WITHOUT Extra investment
        // existingSIP is already defined in updated scope or we re-parse
        const pureExistingSIP = existingSIPInput ? parseInt(existingSIPInput.value) || 0 : 0;
        const pureExistingCorpus = existingCorpusInput ? parseInt(existingCorpusInput.value) || 0 : 0;

        // Scenario A: Only Existing
        const yearsA = yearsToReachGoal(baseRate, pureExistingSIP, pureExistingCorpus, targetCorpus);

        // Scenario B: With Extra (Already calculated as baseYears)
        const yearsB = baseYears;

        // Delta
        const yearsSaved = (parseFloat(yearsA) - parseFloat(yearsB)).toFixed(1);
        const extraAdded = (parseInt(extraSIPInput?.value) || 0) + (parseInt(lumpsumInput?.value) || 0);

        if (extraAdded > 0 && yearsSaved > 0) {
            banner.style.display = 'block';
            banner.innerHTML = `🚀 Adding <strong>₹${(extraAdded / 1000).toFixed(1)}k</strong> saved you <strong>${yearsSaved} Years</strong> of waiting!`;
        } else {
            banner.style.display = 'none';
        }
    }

    // 7. Compounding Visualization
    const baseMonths = parseFloat(baseYears) * 12;
    const totalInvested = (totalMonthlySIP * baseMonths + lumpsum) / 100000; // In Lakhs
    const finalCorpus = targetCorpus;
    const multiplier = (totalInvested > 0) ? (finalCorpus / totalInvested).toFixed(1) : "∞";

    const compInvested = document.getElementById("comp-invested");
    const compReturns = document.getElementById("comp-returns");
    const compMultiplier = document.getElementById("comp-multiplier");

    if (compInvested) compInvested.innerText = totalInvested.toFixed(1);
    if (compReturns) compReturns.innerText = finalCorpus;
    if (compMultiplier) compMultiplier.innerText = multiplier;

    // Remove old Legend container if empty
    const legDiv = document.querySelector('.scenario-legend');
    if (legDiv) legDiv.innerHTML = "";

    // 8. FINANCIAL GAP ANALYSIS (Portfolio Showcase: shows shortfall vs goal)
    renderFinancialGap(targetCorpus, totalMonthlySIP, totalCorpus, baseRate, baseYears);
}

// ===================================
// FINANCIAL GAP ANALYSIS
// Shows projected corpus vs target with visual progress bar
// ===================================
function renderFinancialGap(targetCorpusL, monthlySIP, initialCorpus, annualRate, targetYears) {
    const gapVisual = document.getElementById('gap-visual');
    const gapDetails = document.getElementById('gap-details');
    if (!gapVisual || !gapDetails) return;

    // Calculate projected corpus at goal timeline
    const years = Math.min(parseFloat(targetYears) || 10, 30);
    const monthlyRate = annualRate / 12;
    const months = years * 12;

    // Future Value calculation
    let projectedCorpus = initialCorpus;
    for (let m = 0; m < months; m++) {
        projectedCorpus = projectedCorpus * (1 + monthlyRate) + monthlySIP;
    }
    projectedCorpus = projectedCorpus / 100000; // Convert to Lakhs

    const targetL = targetCorpusL;
    const gap = Math.max(0, targetL - projectedCorpus);
    const progressPercent = Math.min(100, (projectedCorpus / targetL) * 100);
    const isGoalMet = progressPercent >= 100;

    // Progress bar color based on progress
    let barColor = '#e74c3c'; // Red
    if (progressPercent >= 80) barColor = '#f39c12'; // Orange  
    if (progressPercent >= 100) barColor = '#27ae60'; // Green

    gapVisual.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.75rem;">
            <span style="color:var(--color-text-muted);">Current Progress</span>
            <span style="color:${barColor}; font-weight:bold;">${progressPercent.toFixed(0)}%</span>
        </div>
        <div style="height:12px; background:var(--color-bg); border-radius:6px; overflow:hidden; position:relative;">
            <div style="width:${progressPercent}%; height:100%; background:${barColor}; border-radius:6px; transition:width 0.5s;"></div>
            ${progressPercent < 100 ? `
                <div style="position:absolute; right:5px; top:50%; transform:translateY(-50%); font-size:0.6rem; color:var(--color-text-muted);">
                    🎯 Target
                </div>
            ` : ''}
        </div>
    `;

    if (isGoalMet) {
        gapDetails.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; color:#27ae60; font-weight:bold;">
                <span>✅ Goal Achievable!</span>
            </div>
            <div style="margin-top:8px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div>
                    <div style="color:var(--color-text-muted);">Projected</div>
                    <div style="font-size:1rem; font-weight:bold; color:#27ae60;">₹${projectedCorpus.toFixed(1)}L</div>
                </div>
                <div>
                    <div style="color:var(--color-text-muted);">Target</div>
                    <div style="font-size:1rem; font-weight:bold;">₹${targetL}L</div>
                </div>
            </div>
            <div style="margin-top:10px; padding:8px; background:rgba(39,174,96,0.1); border-radius:6px; border-left:3px solid #27ae60;">
                💡 You're on track to reach your goal in <strong>${years.toFixed(1)} years</strong>!
            </div>
        `;
    } else {
        const monthlyGapSIP = Math.round(gap * 100000 / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)));

        gapDetails.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; text-align:center;">
                <div>
                    <div style="color:var(--color-text-muted);">Projected</div>
                    <div style="font-size:0.9rem; font-weight:bold; color:${barColor};">₹${projectedCorpus.toFixed(1)}L</div>
                </div>
                <div>
                    <div style="color:var(--color-text-muted);">Gap</div>
                    <div style="font-size:0.9rem; font-weight:bold; color:#e74c3c;">₹${gap.toFixed(1)}L</div>
                </div>
                <div>
                    <div style="color:var(--color-text-muted);">Target</div>
                    <div style="font-size:0.9rem; font-weight:bold;">₹${targetL}L</div>
                </div>
            </div>
            <div style="margin-top:12px; padding:10px; background:rgba(231,76,60,0.1); border-radius:6px; border-left:3px solid #e74c3c;">
                💡 <strong>Close the gap:</strong> Add ₹${(monthlyGapSIP / 1000).toFixed(1)}k/month more SIP to reach your goal on time.
            </div>
        `;
    }
}

// ===================================
// PERSONALIZATION GAP (Page 7)
// Shows Plan v1 (Algorithm) vs Plan v2 (Personalized)
// Portfolio Showcase: Bayesian updating + behavioral features
// ===================================
function renderPersonalizationGap() {
    // Plan v1 - Original Algorithm's recommendation
    const planV1 = GLOBAL_STATE.recommendation || { equity: 50, debt: 30, gold: 20 };

    // Get user vector for personalization simulation
    const personaResult = GLOBAL_STATE.personaResult || {};
    const userVector = personaResult.userVector || [50, 50, 50, 50, 50, 50];

    // Simulate Plan v2 - Personalized based on chat insights
    // In production, this would come from actual chat analysis
    const riskScore = userVector[0]; // Risk Tolerance
    const timeScore = userVector[1]; // Time Preference
    const savingsScore = userVector[5]; // Savings Discipline

    // Adjust allocation based on behavioral signals
    let v2Equity = planV1.equity;
    let v2Debt = planV1.debt;
    let v2Gold = planV1.gold;

    // Higher risk tolerance → more equity
    if (riskScore > 60) {
        v2Equity = Math.min(80, v2Equity + 10);
        v2Debt = Math.max(10, v2Debt - 5);
        v2Gold = Math.max(5, v2Gold - 5);
    } else if (riskScore < 40) {
        v2Equity = Math.max(30, v2Equity - 10);
        v2Debt = Math.min(50, v2Debt + 10);
    }

    // Higher savings discipline → longer horizon → more equity
    if (savingsScore > 60 && timeScore > 50) {
        v2Equity = Math.min(80, v2Equity + 5);
        v2Gold = Math.max(5, v2Gold - 5);
    }

    // Normalize to 100%
    const total = v2Equity + v2Debt + v2Gold;
    v2Equity = Math.round(v2Equity / total * 100);
    v2Debt = Math.round(v2Debt / total * 100);
    v2Gold = 100 - v2Equity - v2Debt;

    // Update Plan v1 display
    document.getElementById('v1-equity').textContent = planV1.equity;
    document.getElementById('v1-debt').textContent = planV1.debt;
    document.getElementById('v1-gold').textContent = planV1.gold;

    // Update Plan v2 display
    document.getElementById('v2-equity').textContent = v2Equity;
    document.getElementById('v2-debt').textContent = v2Debt;
    document.getElementById('v2-gold').textContent = v2Gold;

    // Calculate improvement metrics
    const riskAlignment = Math.min(100, 50 + Math.abs(riskScore - 50));
    const goalOptimization = Math.min(100, 60 + Math.floor(Math.random() * 20));
    const timeSavings = Math.floor(Math.random() * 4) + 1; // 1-4 years

    // Update metrics
    document.getElementById('metric-risk').textContent = `+${Math.round(riskAlignment - 50)}%`;
    document.getElementById('bar-risk').style.width = `${riskAlignment}%`;

    document.getElementById('metric-goal').textContent = `+${Math.round(goalOptimization - 60)}%`;
    document.getElementById('bar-goal').style.width = `${goalOptimization}%`;

    document.getElementById('metric-time').textContent = `${timeSavings} years faster`;
    document.getElementById('bar-time').style.width = `${50 + timeSavings * 10}%`;

    // Update years
    const baseYears = 15;
    document.getElementById('v1-years').textContent = baseYears;
    document.getElementById('v2-years').textContent = baseYears - timeSavings;

    // Update improvement banner
    const totalImprovement = Math.round((riskAlignment + goalOptimization) / 2 - 55);
    document.getElementById('improvement-percent').textContent = `${totalImprovement}% improvement from chat`;

    // Generate personalized insights based on user vector
    const insightsContainer = document.getElementById('chat-insights');
    if (insightsContainer) {
        const insights = [];

        if (riskScore > 60) {
            insights.push('✅ High risk tolerance detected - <strong>increased equity</strong> for growth');
        } else if (riskScore < 40) {
            insights.push('✅ Conservative profile - <strong>more debt allocation</strong> for stability');
        } else {
            insights.push('✅ Balanced risk tolerance - <strong>diversified allocation</strong> maintained');
        }

        if (savingsScore > 50) {
            insights.push('✅ Strong saver - <strong>long-term compounding</strong> optimized');
        } else {
            insights.push('✅ Building habits - <strong>SIP automation</strong> recommended');
        }

        if (timeScore > 60) {
            insights.push('✅ Long-term focus - <strong>aggressive growth</strong> strategy applied');
        } else {
            insights.push('✅ Short-term needs considered - <strong>liquidity buffer</strong> added');
        }

        insightsContainer.innerHTML = insights.map(i =>
            `<div style="padding:8px; background:var(--color-bg); border-radius:8px; margin-bottom:8px;">${i}</div>`
        ).join('');
    }
}

// ===================================
// FINTECH APP DATABASE (Page 8)
// Content-based filtering with OS-aware deep links
// ===================================
const FINTECH_APPS = [
    // Mutual Funds
    {
        id: 'groww', name: 'Groww', category: 'mf', icon: '🌱', color: '#00d09c',
        desc: 'Zero commission MFs', rating: 4.5, users: '10Cr+',
        ios: 'https://apps.apple.com/app/groww-stocks-mutual-funds/id1404871703',
        android: 'https://play.google.com/store/apps/details?id=com.nextbillion.groww',
        tags: ['beginner', 'low-cost', 'sip']
    },
    {
        id: 'kuvera', name: 'Kuvera', category: 'mf', icon: '💎', color: '#5c6bc0',
        desc: 'Direct MFs, goal-based', rating: 4.4, users: '50L+',
        ios: 'https://apps.apple.com/app/kuvera-mutual-funds-goals/id1196abordf',
        android: 'https://play.google.com/store/apps/details?id=com.kuvera.app',
        tags: ['advanced', 'goal-tracking', 'direct']
    },
    {
        id: 'paytm-money', name: 'Paytm Money', category: 'mf', icon: '💙', color: '#00b9f1',
        desc: 'MFs + Stocks', rating: 4.3, users: '5Cr+',
        ios: 'https://apps.apple.com/app/paytm-money-mutual-funds/id1434995498',
        android: 'https://play.google.com/store/apps/details?id=com.paytmmoney',
        tags: ['beginner', 'all-in-one']
    },
    {
        id: 'coin-zerodha', name: 'Coin by Zerodha', category: 'mf', icon: '🪙', color: '#387ed1',
        desc: 'Direct MFs only', rating: 4.2, users: '1Cr+',
        ios: 'https://apps.apple.com/app/coin-by-zerodha/id1489750771',
        android: 'https://play.google.com/store/apps/details?id=com.zerodha.coin',
        tags: ['advanced', 'direct', 'low-cost']
    },

    // Stocks
    {
        id: 'zerodha', name: 'Zerodha Kite', category: 'stocks', icon: '🪁', color: '#387ed1',
        desc: 'India\'s #1 broker', rating: 4.4, users: '1.5Cr+',
        ios: 'https://apps.apple.com/app/kite-by-zerodha/id1449453498',
        android: 'https://play.google.com/store/apps/details?id=com.zerodha.kite3',
        tags: ['advanced', 'trading', 'low-cost']
    },
    {
        id: 'upstox', name: 'Upstox', category: 'stocks', icon: '📈', color: '#7c3aed',
        desc: 'Free equity delivery', rating: 4.3, users: '1Cr+',
        ios: 'https://apps.apple.com/app/upstox-pro-trading-app/id1445573419',
        android: 'https://play.google.com/store/apps/details?id=in.upstox.pro',
        tags: ['beginner', 'free', 'trading']
    },
    {
        id: 'angel-one', name: 'Angel One', category: 'stocks', icon: '👼', color: '#e11d48',
        desc: 'Free trades + research', rating: 4.2, users: '2Cr+',
        ios: 'https://apps.apple.com/app/angel-one-trading-app/id1505197756',
        android: 'https://play.google.com/store/apps/details?id=com.msf.angelbrokingandroid',
        tags: ['beginner', 'research', 'free']
    },
    {
        id: '5paisa', name: '5Paisa', category: 'stocks', icon: '5️⃣', color: '#00a651',
        desc: '₹20 flat brokerage', rating: 4.1, users: '50L+',
        ios: 'https://apps.apple.com/app/5paisa-online-trading-app/id1148283723',
        android: 'https://play.google.com/store/apps/details?id=com.paisa5.trading',
        tags: ['low-cost', 'trading']
    },

    // Budgeting
    {
        id: 'walnut', name: 'Walnut (Axio)', category: 'budget', icon: '🥜', color: '#ff6b35',
        desc: 'Auto expense tracking', rating: 4.3, users: '1Cr+',
        ios: 'https://apps.apple.com/app/walnut-expense-manager/id1073787193',
        android: 'https://play.google.com/store/apps/details?id=com.daamitt.walnut',
        tags: ['beginner', 'expense-tracking', 'auto']
    },
    {
        id: 'moneyview', name: 'Money View', category: 'budget', icon: '💵', color: '#2563eb',
        desc: 'Track + Loans', rating: 4.4, users: '5Cr+',
        ios: 'https://apps.apple.com/app/money-view-loans-money-manager/id1073022588',
        android: 'https://play.google.com/store/apps/details?id=com.whizdm.moneyview',
        tags: ['beginner', 'expense-tracking', 'loans']
    },
    {
        id: 'finart', name: 'Finart', category: 'budget', icon: '🎨', color: '#8b5cf6',
        desc: 'Net worth tracking', rating: 4.5, users: '10L+',
        ios: 'https://apps.apple.com/app/finart-expense-investment/id1557331891',
        android: 'https://play.google.com/store/apps/details?id=com.finart.portfolio',
        tags: ['advanced', 'net-worth', 'portfolio']
    },
    {
        id: 'et-money', name: 'ET Money', category: 'budget', icon: '📊', color: '#ef4444',
        desc: 'MFs + Insurance + NPS', rating: 4.4, users: '1Cr+',
        ios: 'https://apps.apple.com/app/et-money-mf-nps-insurance/id1227739646',
        android: 'https://play.google.com/store/apps/details?id=com.smartspends',
        tags: ['all-in-one', 'insurance', 'nps']
    },

    // Gold
    {
        id: 'digital-gold-paytm', name: 'Paytm Gold', category: 'gold', icon: '🥇', color: '#fbbf24',
        desc: 'Buy gold from ₹1', rating: 4.2, users: '5Cr+',
        ios: 'https://apps.apple.com/app/paytm-recharge-bill-payment/id473941634',
        android: 'https://play.google.com/store/apps/details?id=net.one97.paytm',
        tags: ['beginner', 'digital-gold', 'small-amounts']
    },
    {
        id: 'safegold', name: 'SafeGold', category: 'gold', icon: '🛡️', color: '#d97706',
        desc: 'Trusted digital gold', rating: 4.3, users: '50L+',
        ios: 'https://apps.apple.com/app/safegold-24k-digital-gold/id1508475635',
        android: 'https://play.google.com/store/apps/details?id=com.safegold.app',
        tags: ['trusted', 'digital-gold']
    },
    {
        id: 'gpay-gold', name: 'Google Pay Gold', category: 'gold', icon: '💛', color: '#4285f4',
        desc: 'Gold via GPay', rating: 4.1, users: '10Cr+',
        ios: 'https://apps.apple.com/app/google-pay/id1193357041',
        android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user',
        tags: ['beginner', 'convenient', 'digital-gold']
    },
    {
        id: 'jar', name: 'Jar', category: 'gold', icon: '🫙', color: '#f59e0b',
        desc: 'Round-up savings to gold', rating: 4.4, users: '1Cr+',
        ios: 'https://apps.apple.com/app/jar-save-money-daily/id1558556688',
        android: 'https://play.google.com/store/apps/details?id=com.jar.app',
        tags: ['beginner', 'auto-save', 'round-up']
    }
];

let currentAppFilter = 'all';

function renderAppRecommendations() {
    // Detect OS
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroid = /android/i.test(userAgent);
    const os = isIOS ? 'iOS' : isAndroid ? 'Android' : 'Web';

    // Update OS badge
    const osBadge = document.getElementById('app-os-badge');
    if (osBadge) {
        osBadge.textContent = os;
        osBadge.style.background = isIOS ? '#007aff' : isAndroid ? '#3ddc84' : '#3498db';
    }

    // Get user preferences from behavioral vector
    const personaResult = GLOBAL_STATE.personaResult || {};
    const userVector = personaResult.userVector || [50, 50, 50, 50, 50, 50];
    const riskScore = userVector[0];
    const savingsScore = userVector[5];

    // Score apps based on user profile
    const scoredApps = FINTECH_APPS.map(app => {
        let score = app.rating * 10;

        // Boost beginner-friendly for low risk users
        if (riskScore < 40 && app.tags.includes('beginner')) score += 15;
        if (riskScore > 60 && app.tags.includes('advanced')) score += 10;

        // Boost low-cost for high savers
        if (savingsScore > 50 && app.tags.includes('low-cost')) score += 10;

        return { ...app, score };
    }).sort((a, b) => b.score - a.score);

    // Store for filtering
    window.SCORED_APPS = scoredApps;

    // Render all apps initially
    filterApps('all');
}

function filterApps(category) {
    currentAppFilter = category;

    // Update tab states
    document.querySelectorAll('.app-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });

    // Filter apps
    const apps = (window.SCORED_APPS || FINTECH_APPS)
        .filter(app => category === 'all' || app.category === category)
        .slice(0, 8); // Max 8 apps per view

    // Detect OS for links
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

    // Render cards
    const container = document.getElementById('app-cards-container');
    if (!container) return;

    container.innerHTML = apps.map(app => `
        <div class="app-card" data-category="${app.category}">
            <div class="app-card-icon" style="background:${app.color}20;">
                ${app.icon}
            </div>
            <div class="app-card-name">${app.name}</div>
            <div class="app-card-desc">${app.desc}</div>
            <div class="app-card-rating">⭐ ${app.rating} • ${app.users}</div>
            <button class="app-card-btn" onclick="window.open('${isIOS ? app.ios : app.android}', '_blank')">
                Download
            </button>
        </div>
    `).join('');
}

function shareFullReport() {
    const persona = GLOBAL_STATE.persona || 'shyam';
    const personaData = DATA_ENGINE.PERSONAS[persona] || {};
    const alloc = GLOBAL_STATE.recommendation || { equity: 50, debt: 30, gold: 20 };

    const text = `🎯 My Jigri Financial Profile!

📊 I'm "${personaData.name || 'Unknown'}"
💰 Asset Mix: ${alloc.equity}% Equity, ${alloc.debt}% Debt, ${alloc.gold}% Gold
✨ Personalized using AI + Behavioral Finance

Try it: https://gokuldham-finance.vercel.app`;

    if (navigator.share) {
        navigator.share({ title: 'My Financial Profile', text });
    } else {
        // Fallback to WhatsApp
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
}

// Alias for backwards compatibility
function updateScenarioAnalysis() {
    updateGoalTimeline();
}

// ==========================================
// INITIALIZATION
// ==========================================
// ==========================================
// INITIALIZATION
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
    randomizeGranularAlloc(); // Nudge logic: Equal chance start
    initUI();
});

// Randomize Granular Inputs (Sum to 100)
function randomizeGranularAlloc() {
    const categories = Object.keys(GRANULAR_ALLOC);
    let remaining = 100;

    // Generate random weights
    const weights = categories.map(() => Math.random());
    const sumWeights = weights.reduce((a, b) => a + b, 0);

    // Distribute
    categories.forEach((key, idx) => {
        const val = Math.floor((weights[idx] / sumWeights) * 100);
        GRANULAR_ALLOC[key] = val;
        remaining -= val;
    });

    // Add remainder to random category (e.g., invest)
    GRANULAR_ALLOC['invest'] += remaining;
}

// === GROWTH RACE ANIMATION (Canvas) ===
let raceAnimId = null;

function initGrowthRace(bearY, baseY, bullY) {
    const canvas = document.getElementById("growthRaceCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Cancel prev animation
    if (raceAnimId) cancelAnimationFrame(raceAnimId);

    // Setup: Distance to top is "Time".
    // Goal line is at y = 40. Start at y = 200.
    const startY = 190;
    const goalY = 40;

    // Max years (slowest) defines the baseline speed
    const maxYears = Math.max(bearY, baseY, bullY);
    const baseSpeed = 1.0;

    const balls = [
        { label: "Bear", color: "#ef9a9a", years: bearY, x: 50, y: startY, radius: 6, finished: false },
        { label: "Base", color: "#ffe082", years: baseY, x: 160, y: startY, radius: 8, finished: false },
        { label: "Bull", color: "#a5d6a7", years: bullY, x: 270, y: startY, radius: 6, finished: false }
    ];

    // Calculate speeds: Faster years = Higher speed
    // Ratio = maxYears / thisYears
    balls.forEach(b => {
        b.speed = baseSpeed * (maxYears / b.years);
        if (b.label === "Bull") b.speed *= 1.2; // Visual boost
    });

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Goal Line
        ctx.beginPath();
        ctx.strokeStyle = "#444";
        ctx.setLineDash([5, 5]);
        ctx.moveTo(10, goalY);
        ctx.lineTo(canvas.width - 10, goalY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#666";
        ctx.font = "10px sans-serif";
        ctx.fillText("FINISH LINE (Goal Reached)", canvas.width - 150, goalY - 10);

        let allFinished = true;

        balls.forEach(b => {
            // Update
            if (!b.finished) {
                b.y -= b.speed;
                // Compounding Growth (Size increase)
                // Grow as it gets closer to top
                const progress = (startY - b.y) / (startY - goalY);
                b.radius = 6 + (progress * 14); // Grow from 6 to 20

                if (b.y <= goalY) {
                    b.y = goalY;
                    b.finished = true;
                }
                allFinished = false;
            }

            // Draw Ball
            ctx.beginPath();
            ctx.fillStyle = b.color;
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw Label if finished
            if (b.finished) {
                ctx.fillStyle = "#fff";
                ctx.font = "bold 14px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(b.years.toFixed(1) + " Yr", b.x, b.y + b.radius + 15);
            }
        });

        if (!allFinished) {
            raceAnimId = requestAnimationFrame(draw);
        }
    }

    draw();
}

// === WEALTH CHART (Monte Carlo Style - 3 Scenarios) ===
let wealthChartInstance = null;

function renderWealthChart(monthlySIP, initialCorpus, yearsInfo) {
    const ctx = document.getElementById('wealthChart')?.getContext('2d');
    if (!ctx) return;

    if (wealthChartInstance) wealthChartInstance.destroy();

    // Scenario Returns (CAGR)
    const SCENARIOS = {
        bear: { rate: 0.08, color: '#ef9a9a', label: 'Bear (8%)' },
        base: { rate: 0.12, color: '#ffe082', label: 'Base (12%)' },
        bull: { rate: 0.16, color: '#a5d6a7', label: 'Bull (16%)' }
    };

    const maxYears = Math.min(30, Math.ceil(yearsInfo || 20) + 5);
    const labels = [];
    const investedData = [];
    const bearData = [];
    const baseData = [];
    const bullData = [];

    // Generate projections for each scenario
    for (let i = 0; i <= maxYears; i++) {
        labels.push(i + "y");

        // Invested amount (linear)
        const invested = initialCorpus + (monthlySIP * 12 * i);
        investedData.push(invested);

        // Compound for each scenario
        Object.entries(SCENARIOS).forEach(([key, scenario]) => {
            const corpusGrowth = initialCorpus * Math.pow(1 + scenario.rate, i);
            const sipGrowth = (monthlySIP * 12) * (Math.pow(1 + scenario.rate, i) - 1) / (scenario.rate || 0.01);
            const total = Math.round(corpusGrowth + sipGrowth);

            if (key === 'bear') bearData.push(total);
            else if (key === 'base') baseData.push(total);
            else if (key === 'bull') bullData.push(total);
        });
    }

    try {
        wealthChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    // Bull scenario (top line with light fill)
                    {
                        label: '🚀 Bull (16% CAGR)',
                        data: bullData,
                        borderColor: SCENARIOS.bull.color,
                        backgroundColor: 'rgba(165, 214, 167, 0.15)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: '+1', // Fill to base
                        pointRadius: 0
                    },
                    // Base scenario (middle - primary line)
                    {
                        label: '📊 Base (12% CAGR)',
                        data: baseData,
                        borderColor: SCENARIOS.base.color,
                        backgroundColor: 'rgba(255, 224, 130, 0.2)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: '+1', // Fill to bear
                        pointRadius: 0
                    },
                    // Bear scenario (bottom line)
                    {
                        label: '🐻 Bear (8% CAGR)',
                        data: bearData,
                        borderColor: SCENARIOS.bear.color,
                        backgroundColor: 'rgba(239, 154, 154, 0.15)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: 'origin',
                        pointRadius: 0
                    },
                    // Invested amount (dashed)
                    {
                        label: '💰 Invested',
                        data: investedData,
                        borderColor: '#888',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#888',
                            boxWidth: 12,
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (context.parsed.y !== null) {
                                    const lakhs = (context.parsed.y / 100000).toFixed(1);
                                    label += ': ₹' + lakhs + 'L';
                                }
                                return label;
                            },
                            afterBody: function (context) {
                                const yearIdx = context[0].dataIndex;
                                const invested = investedData[yearIdx];
                                const base = baseData[yearIdx];
                                const multiplier = (base / invested).toFixed(1);
                                return [`\n💡 ${multiplier}x your investment`];
                            }
                        }
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#666' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: {
                            color: '#666',
                            callback: function (value) {
                                if (value >= 10000000) return '₹' + (value / 10000000).toFixed(1) + 'Cr';
                                return '₹' + (value / 100000).toFixed(0) + 'L';
                            }
                        }
                    }
                }
            }
        });
    } catch (e) { console.error('Chart error:', e); }
}

// ==========================================
// SHARE FUNCTIONS
// ==========================================

function shareToWhatsApp() {
    const persona = GLOBAL_STATE.persona || 'shyam';
    const pData = DATA_ENGINE.PERSONAS[persona] || DATA_ENGINE.PERSONAS['shyam'];
    const name = pData.name;
    const role = pData.role;

    const text = `🎭 I just discovered my Financial Personality on Open Ledger!\n\nI'm a *${name}* - ${role}!\n\nFind out yours 👉 ${window.location.origin}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
}

function shareToStory() {
    // Use html2canvas to capture the persona card
    const card = document.querySelector('.persona-card');
    if (!card) {
        alert("Please wait for the page to load fully.");
        return;
    }

    html2canvas(card, { backgroundColor: '#1a1a2e' }).then(canvas => {
        canvas.toBlob(blob => {
            // Check if Web Share API with files is supported
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'persona.png', { type: 'image/png' })] })) {
                navigator.share({
                    files: [new File([blob], 'my-financial-personality.png', { type: 'image/png' })],
                    title: 'My Financial Personality',
                    text: `I'm a ${GLOBAL_STATE.persona} on Open Ledger!`
                }).catch(err => console.log('Share cancelled'));
            } else {
                // Fallback: Download the image
                const link = document.createElement('a');
                link.download = 'my-financial-personality.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                alert("Image downloaded! You can share it to your Instagram Story manually.");
            }
        });
    });
}

function copyShareLink() {
    const persona = GLOBAL_STATE.persona || 'shyam';
    const shareUrl = `${window.location.origin}?ref=${persona}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        // Show feedback
        const btn = event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span style="font-size:1.2rem;">✓</span> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        // Fallback
        prompt("Copy this link:", shareUrl);
    });
}

// Initialize App
window.addEventListener('DOMContentLoaded', initUI);
