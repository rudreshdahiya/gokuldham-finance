
const ForensicsEngine = {};

// ===================================
// 1. PERSONA DETERMINATION LOGIC
// ===================================
ForensicsEngine.determinePersona = function (dataEngine, salaryInput, state, ageGroup, needs, wants, savings, goalsInput, granular, accumulatedCCTotal = 0) {
    let personaKey = "shyam";
    let logicLog = [];

    // Normalize inputs
    // salaryInput is ANNUAL
    const salary = salaryInput || 500000;

    // Normalize goals to Array
    const goals = Array.isArray(goalsInput) ? goalsInput : [goalsInput];
    const hasGoal = (key) => goals.some(g => g.toLowerCase().includes(key));

    // --- PULSE MULTIPLIER LOGIC ---
    let stateMultiplier = 1.0;
    let stateKey = state;
    if (state && typeof state === 'string') {
        stateKey = state.toLowerCase().replace(/\s+/g, '-');
    }

    if (dataEngine.STATE_MULTIPLIERS) {
        if (dataEngine.STATE_MULTIPLIERS[stateKey]) {
            stateMultiplier = dataEngine.STATE_MULTIPLIERS[stateKey];
        } else {
            for (const [key, val] of Object.entries(dataEngine.STATE_MULTIPLIERS)) {
                if (stateKey.includes(key)) {
                    stateMultiplier = val;
                    break;
                }
            }
        }
    }

    // 1. PPP Calculation (Annual Salary / Multiplier)
    const ppp = salary / stateMultiplier;
    let pppTier = "MID_LOW";
    if (ppp < 600000) pppTier = "LOW";
    else if (ppp < 1200000) pppTier = "MID_LOW";
    else if (ppp < 2500000) pppTier = "MID_HIGH";
    else pppTier = "HIGH";

    logicLog.push(`PPP Tier: ${pppTier} (Salary: ${salary} / Mul: ${stateMultiplier})`);

    // 2. Behavioral Clustering
    let behavior = "BALANCED";

    // TUNED V3: Wants > 30 (was 25)
    if (wants > 30) behavior = "SPENDER";
    else if (savings > 30) behavior = "SAVER";
    else if (needs > 55) behavior = "SURVIVOR"; // TUNED V3: > 55 (was 60)
    else behavior = "BALANCED";

    logicLog.push(`Behavior Mode: ${behavior} (W:${wants} S:${savings} N:${needs})`);

    // 3. Granular Winner
    let dominantWant = "generic";
    let maxVal = 0;
    if (granular) {
        for (const [key, val] of Object.entries(granular)) {
            if (val > maxVal) {
                maxVal = val;
                dominantWant = key;
            }
        }
    }
    logicLog.push(`Dominant Want: ${dominantWant}`);

    // ==========================================
    // FINAL MAPPING LOGIC (TUNED V3)
    // ==========================================

    if (pppTier === "HIGH") { // > 25L
        if (behavior === "SPENDER") {
            if (dominantWant === "shopping") personaKey = "poo";
            else if (dominantWant === "travel") personaKey = "bunny";
            else if (dominantWant === "entertainment") personaKey = "raj";
            else personaKey = "chatur";
        } else if (behavior === "SAVER") {
            if (savings > 50) personaKey = "rancho";
            else personaKey = "farhan";
        } else {
            personaKey = "raj";
        }
    }

    else if (pppTier === "MID_HIGH") { // 12L-25L
        if (behavior === "SPENDER") {
            // Tuned: High shopping in mid-tier allows Poo
            if (dominantWant === "shopping" && granular && granular.shopping > 35) personaKey = "poo";

            else if (dominantWant === "shopping") personaKey = "chatur";
            else if (dominantWant === "travel") personaKey = "geet";
            else if (dominantWant === "dining") personaKey = "munna";
            else personaKey = "geet";
        } else if (behavior === "SAVER") {
            if (granular && granular.travel > 15) personaKey = "rani";
            else personaKey = "simran";
        } else if (behavior === "SURVIVOR") {
            personaKey = "shyam";
        } else {
            personaKey = "farhan";
        }
    }

    else if (pppTier === "MID_LOW") { // 6L-12L
        if (behavior === "SPENDER") {
            // Tuned V3: Broader criteria for Munna/Veeru to steal from Raju
            if (dominantWant === "dining" || (granular && granular.dining > 20)) personaKey = "munna";
            else if (dominantWant === "entertainment" || (granular && granular.entertainment > 20)) personaKey = "veeru";
            else if (dominantWant === "travel") personaKey = "bunny";

            else if (needs < 45) personaKey = "raju";
            else personaKey = "raju";
        } else if (behavior === "SAVER") {
            // Tuned: Allow Simran if savings high
            if (savings > 40) personaKey = "simran";
            else personaKey = "shyam";
        } else if (behavior === "SURVIVOR") {
            // Tuned V3: Relaxed Circuit
            if (granular && granular.dining > 5) personaKey = "circuit";
            else personaKey = "pushpa";
        } else {
            personaKey = "shyam";
        }
    }

    else { // LOW (< 6L)
        if (behavior === "SPENDER") personaKey = "raju";
        else if (behavior === "SAVER") personaKey = "baburao";
        else if (behavior === "SURVIVOR") {
            // Tuned V3: Lowered threshold for Pushpa
            if (needs > 65) personaKey = "pushpa";
            else personaKey = "circuit";
        } else {
            personaKey = "baburao";
        }
    }

    logicLog.push(`Final Persona: ${personaKey}`);

    return {
        key: personaKey,
        log: logicLog,
        effectiveSavings: savings * stateMultiplier
    };
};

// ===================================
// 2. FINANCIAL PRESCRIPTION LOGIC
// ===================================
ForensicsEngine.generateFinancialPrescription = function (dataEngine, ageRange, income, goalIdsInput, savingsRate, emiRate, macroData) {
    // Normalize
    const goalIds = Array.isArray(goalIdsInput) ? goalIdsInput : [goalIdsInput];
    let totalMonthlySIP = 0;
    let totalCorpus = 0; // Not used yet
    let blendedEquity = 0, blendedDebt = 0, blendedGold = 0;
    let primaryGoalLabel = "";

    // Default Macro Data
    const inflation = macroData ? macroData.inflation : 6.0;
    const marketMood = "Neutral"; // Simplified

    // 1. Goal-Based Allocation
    // We average allocation of all selected goals? Or take safe-est?
    // Let's use weighted average or simply Sum.
    // For V1, we use the Primary Goal (first one).
    const pGoalId = goalIds[0] || "wealth";
    const pGoal = dataEngine.ALL_GOALS[pGoalId] || dataEngine.ALL_GOALS["wealth"];
    primaryGoalLabel = pGoal.label;

    let targetEquity = pGoal.alloc.equity;
    let targetDebt = pGoal.alloc.debt;
    let targetGold = pGoal.alloc.gold;

    // 2. Age Adjustment (Rule of 100)
    // Age 25 -> 75% Equity. Goal says 60%. We take avg?
    // Let's bias towards Goal.

    // 3. Risk Capacity (Savings Rate)
    // High savings > 40% -> Can take more risk (+5% Equity)
    if (savingsRate > 40) {
        targetEquity += 5;
        targetDebt -= 5;
    } else if (savingsRate < 10) {
        targetEquity -= 10;
        targetDebt += 10;
    }

    // Clamp
    targetEquity = Math.max(10, Math.min(90, targetEquity));
    targetDebt = Math.max(5, Math.min(90, targetDebt));
    targetGold = 100 - targetEquity - targetDebt;

    return {
        equity: targetEquity,
        debt: targetDebt,
        gold: targetGold,
        reco: `Optimized for ${primaryGoalLabel}`,
        confidence: "High",
        allocation: { equity: targetEquity, debt: targetDebt, gold: targetGold }
    };
};

// Export
if (typeof window !== 'undefined') {
    window.FORENSICS_ENGINE = ForensicsEngine;
} else if (typeof module !== 'undefined') {
    module.exports = ForensicsEngine;
}
