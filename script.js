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
    if (target) target.classList.remove('hidden');

    // Special Inits per Page
    if (pageNum === 2) updateLedger(); // Init Sliders
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

// Show neighbor persona in modal when clicked
function showNeighborPersona(personaKey) {
    const personaData = DATA_ENGINE.PERSONAS[personaKey];
    if (!personaData) return;

    // Get user's persona for comparison
    const userPersonaKey = GLOBAL_STATE.persona || 'mehta';
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
    "jethalal": ["abdul", "bagha"], "abdul": ["jethalal", "natukaka"], // Strugglers
    "babita": ["roshan", "daya"], "roshan": ["babita", "tapu"], "daya": ["babita", "anjali"], "tapu": ["roshan", "gogi"], "komal": ["roshan", "hathi"], "anjali": ["daya", "mehta"], // Spenders
    "bhide": ["popatlal", "madhavi"], "popatlal": ["bhide", "champaklal"], "madhavi": ["bhide", "sodhi"], "iyer": ["sodhi", "mehta"], "sodhi": ["iyer", "madhavi"], "champaklal": ["popatlal", "bhide"], // Savers
    "mehta": ["iyer", "bhide"], "bagha": ["jethalal", "popatlal"], "natukaka": ["popatlal", "bagha"] // Balanced/others
};

function renderPersonaPage(personaKey, clusterId) {
    const pData = DATA_ENGINE.PERSONAS[personaKey] || DATA_ENGINE.PERSONAS['mehta'];

    // 1. Basic Info
    document.getElementById("persona-name").innerText = pData.name.toUpperCase();
    document.getElementById("persona-desc").innerText = pData.quote;

    // 2. Image
    const container = document.getElementById("persona-image-container");
    const imgPath = pData.img || "assets/mehta.png";
    container.innerHTML = `<img src="${imgPath}" alt="${pData.name}" 
        style="width:140px; height:140px; border-radius:50%; object-fit:cover; border:4px solid var(--color-bg-card); box-shadow:0 8px 16px rgba(0,0,0,0.15); background:var(--color-bg);"
        onerror="this.src='assets/mehta.png'">`;

    // 3. REASONING LOGIC (Personalized)
    const reason = generateReasoning(personaKey, GLOBAL_STATE.alloc);

    // Build traits HTML
    const traitsHtml = pData.traits ? pData.traits.map(t =>
        `<span style="background:var(--color-bg); border:1px solid var(--color-border); padding:4px 10px; border-radius:15px; font-size:0.75rem; color:var(--color-text-main);">${t}</span>`
    ).join('') : '';

    const statContainer = document.querySelector(".persona-stat");
    statContainer.innerHTML = `
        <!-- Role & Traits -->
        <div style="margin-bottom:15px; text-align:center;">
            <div style="font-size:0.8rem; font-weight:600; color:${pData.color || 'var(--color-primary)'}; margin-bottom:8px;">${pData.role || ''}</div>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:6px;">
                ${traitsHtml}
            </div>
        </div>
        
        <!-- WHY THIS MATCH -->
        <div style="margin-top:15px; padding-top:15px; border-top:1px dashed var(--color-border);">
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
            <div style="text-align:center; opacity:0.85; cursor:pointer;" 
                 onclick="showNeighborPersona('${nKey}')" 
                 title="Click to explore ${nData.name}">
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

    const pData = DATA_ENGINE.PERSONAS[personaKey || 'mehta'];
    if (nameSpan) nameSpan.innerText = (pData.name || "YOU").toUpperCase();

    // Context from User Alloc (Fallback to 50/30/20 only if null)
    const alloc = GLOBAL_STATE.recommendation?.allocation || { equity: 50, debt: 30, gold: 20 };
    const goals = GLOBAL_STATE.demographics.goals || [];
    const age = parseInt(document.getElementById("input-age")?.value) || 30;

    // Dynamic Reasoning Logic
    let equityReason = "";
    if (alloc.equity > 60) equityReason = `To grow wealth aggressively for long-term goals like <strong>${goals[0] || 'Early Retirement'}</strong>.`;
    else if (alloc.equity < 40) equityReason = `To reduce risk, as your goal <strong>${goals[0] || 'Safety'}</strong> is near or you prefer stability.`;
    else equityReason = `To balance growth with safety, ideal for <strong>${goals[0] || 'Wealth Creation'}</strong>.`;

    let debtReason = "To provide liquidity for emergencies.";
    if (alloc.debt > 40) debtReason = `High allocation for safety and to fund short-term needs like <strong>${goals[1] || 'Upcoming Expenses'}</strong>.`;

    let goldReason = "As a hedge against inflation and currency risks.";

    // Add "How we got this" logic header
    container.innerHTML = `
        <div style="margin-bottom:12px; font-size:0.8rem; color:var(--color-primary); border-bottom:1px solid #eee; padding-bottom:5px;">
             <strong>🧬 Strategy Logic:</strong> Based on Age (${age}), Goals (${goals.length}), and Risk Profile.
        </div>
        <div style="margin-bottom:8px; line-height:1.4;">
            <span style="color:#90caf9; font-weight:bold;">● Equity (${alloc.equity}%):</span> ${equityReason}
        </div>
        <div style="margin-bottom:8px; line-height:1.4;">
            <span style="color:#ce93d8; font-weight:bold;">● Debt (${alloc.debt}%):</span> ${debtReason}
        </div>
        <div style="line-height:1.4;">
             <span style="color:#fff59d; font-weight:bold;">● Gold (${alloc.gold}%):</span> ${goldReason}
        </div>
    `;
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
    const pData = DATA_ENGINE.PERSONAS[personaKey] || DATA_ENGINE.PERSONAS['mehta'];
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
    container.innerHTML = `
        <p style="color:var(--color-text-main);">Your portfolio drifts with market volatility. Review every <strong>6 months</strong> or when deviation > 5%.</p>
        <div class="tax-row" style="background:#fff3e0; border-left:4px solid #f39c12; color:#e65100;">
            <span>Next Review Date</span>
            <span>${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
        </div>
        <div style="margin-top:15px; background:var(--color-bg); padding:10px; border-radius:6px; font-size:0.85rem; color:var(--color-text-main);">
            <strong>📌 How to Rebalance:</strong>
            <ol style="margin:5px 0 0 15px; padding:0;">
                <li style="margin-bottom:4px;">Check Current % vs Target %.</li>
                <li style="margin-bottom:4px;">Sell <span style="color:#e74c3c;">Overweight</span> assets (Sell High).</li>
                <li>Buy <span style="color:#27ae60;">Underweight</span> assets (Buy Low).</li>
            </ol>
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

    // 5. Render Chart (Horizontal Bar - Years)
    const ctx = document.getElementById('scenarioChart');
    if (!ctx) return;

    if (window.scenarioChartInstance) {
        window.scenarioChartInstance.destroy();
    }

    // Chart Colors (Pastel V3)
    // Bear: Deep Orange 200, Base: Amber 200, Bull: Green 200
    window.scenarioChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['🐻 Bear', '📊 Base', '🚀 Bull'],
            datasets: [{
                label: 'Years to Goal',
                data: [bearYears, baseYears, bullYears],
                backgroundColor: ['#ffab91', '#ffe082', '#a5d6a7'],
                borderColor: ['#ff8a65', '#ffd54f', '#81c784'],
                borderWidth: 1,
                borderRadius: 6,
                barThickness: 25
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bars
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.parsed.x} years to reach ₹${targetCorpus}L (Real Value)`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Years' },
                    ticks: { callback: (v) => v + 'Y' },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    grid: { display: false }
                }
            }
        }
    });

    // 6. Compounding Visualization
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

    // 7. Legend Context
    const legDiv = document.querySelector('.scenario-legend');
    if (legDiv) {
        legDiv.innerHTML = `
            <div style="padding:10px; background:var(--color-bg-card); border-radius:6px; border:1px solid var(--color-border); margin-top:10px;">
                <div style="margin-bottom:8px; font-size:0.9rem;">
                    <strong>📊 Your Timeline (Real Terms):</strong> At ₹${(totalMonthlySIP / 1000).toFixed(1)}k/month SIP
                </div>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; text-align:center;">
                    <div style="background:#ffebee; padding:8px; border-radius:4px;">
                        <div style="font-size:1.1em; font-weight:bold; color:#e57373;">${bearYears}Y</div>
                        <div style="font-size:0.7em;">Bear (${(bearRate * 100).toFixed(1)}%)</div>
                    </div>
                    <div style="background:#fff8e1; padding:8px; border-radius:4px;">
                        <div style="font-size:1.1em; font-weight:bold; color:#fbc02d;">${baseYears}Y</div>
                        <div style="font-size:0.7em;">Base (${(baseRate * 100).toFixed(1)}%)</div>
                    </div>
                    <div style="background:#e8f5e9; padding:8px; border-radius:4px;">
                        <div style="font-size:1.1em; font-weight:bold; color:#66bb6a;">${bullYears}Y</div>
                        <div style="font-size:0.7em;">Bull (${(bullRate * 100).toFixed(1)}%)</div>
                    </div>
                </div>
                <div style="margin-top:10px; font-size:0.75em; color:#666;">
                    💡 Tip: Add ₹5k extra SIP or ₹1L lumpsum to see how your timeline changes!
                </div>
            </div>
        `;
    }
}

// Alias for backwards compatibility
function updateScenarioAnalysis() {
    updateGoalTimeline();
}

// ==========================================
// INITIALIZATION
// ==========================================
window.addEventListener("DOMContentLoaded", initUI);
