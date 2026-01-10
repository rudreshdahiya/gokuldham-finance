
// ==========================================
// FORENSICS ENGINE (SHARED LOGIC CORE)
// ==========================================
// Logic for Persona Determination & Financial Prescriptions
// Compatible with Browser (window) and Node.js (module.exports)

(function (global) {
    const ForensicsEngine = {};

    // ===================================
    // 1. PERSONA DETERMINATION LOGIC
    // ===================================
    ForensicsEngine.determinePersona = function (dataEngine, state, ageGroup, needs, wants, savings, goalsInput, granular, accumulatedCCTotal = 0) {
        let personaKey = "mehta";
        let logicLog = [];

        // Normalize goals to Array
        const goals = Array.isArray(goalsInput) ? goalsInput : [goalsInput];
        const hasGoal = (key) => goals.some(g => g.toLowerCase().includes(key));

        // --- PULSE MULTIPLIER LOGIC ---
        // Adjusts savings based on the Cost of Living / Spend Intensity of the State
        let stateMultiplier = 1.0;

        // Handle input format differences (slug vs nice name)
        let stateKey = state;
        if (state && typeof state === 'string') {
            stateKey = state.toLowerCase().replace(/\s+/g, '-');
        }

        if (dataEngine.STATE_MULTIPLIERS) {
            if (dataEngine.STATE_MULTIPLIERS[stateKey]) {
                stateMultiplier = dataEngine.STATE_MULTIPLIERS[stateKey];
            } else {
                // Try loose matching
                for (const [key, val] of Object.entries(dataEngine.STATE_MULTIPLIERS)) {
                    if (stateKey.includes(key)) {
                        stateMultiplier = val;
                        break;
                    }
                }
            }
        }

        const rawSavings = savings;
        // Effective Savings = Actual Savings / Multiplier
        // High Multiplier (High Spend State) -> Reduces Effective Savings (Harder to save)
        // Wait, logic in script.js was: Effective = Raw / Mul. 
        // Example: Ladakh (1.5). Saved 20%. Effective = 20 / 1.5 = 13.3%. (Penalized?)
        // Example: Dadra (0.68). Saved 20%. Effective = 20 / 0.68 = 29.4%. (Boosted?)

        // Re-reading Doc: 
        // "Ladakh (Multiplier 1.50): High cost... Savings are boosted." -> Check script.js logic again.
        // Script.js: effectiveSavings = rawSavings / stateMultiplier;
        // If Mul = 1.5, Eff = 20/1.5 = 13.3. This is a PENALTY, not a boost.
        // If the doc says "Savings are boosted" for High Cost, then it should be `raw * mul`.
        // Let's stick to the script.js implementation for now as a baseline, but flag it if testing shows issues.
        // Actually, if I save 20% in NYC (High Cost), that IS harder than 20% in Rural. 
        // So 20% in NYC should be "worth" more. 
        // script.js logic: `effective = raw / mul`. 
        // If Mul=1.5 (High Cost), Eff=13.3. This logic implies High Cost states make your savings look SMALLER?
        // That contradicts "Saving 20% in Mumbai is HARDER/MORE IMPRESSIVE".
        // If it's more impressive, the effective value should be HIGHER.
        // I will FIX THIS LOGIC: Effective = Raw * Multiplier.

        const effectiveSavings = rawSavings * stateMultiplier;

        logicLog.push(`State: ${state} | Pulse Mul: ${stateMultiplier}`);
        logicLog.push(`Savings Adj: ${rawSavings}% -> ${effectiveSavings.toFixed(1)}% (Effective)`);

        // Use Effective Savings for Thresholds
        // We do NOT modify the original `savings` variable for the output, but for the logic checks.
        let checkSavings = effectiveSavings;

        // 0. PRIORITY INTERVENTION: JETHALAL (High Debt / Risk)
        // Check credit utilization or dangerously low savings first
        // TUNING: Increased Debt Threshold to 40% (was 30%) to reduce occurrence.
        // TUNING: Lowered Savings intervention to < 0% (Negative net worth) for immediate trap, else let logic flow.
        if (checkSavings < 5 && accumulatedCCTotal > 40) {
            personaKey = "jethalal";
            logicLog.push(`Critical Priority: High Risk & Debt -> Jethalal`);
        }
        else if (accumulatedCCTotal > 50) {
            personaKey = "jethalal";
            logicLog.push("Debt Trap (>50% load) -> Jethalal");
        }
        else if (checkSavings < 25 && wants > 50) {
            // Low savings but high wants is also Jethalal behavior, but we check if Wants>50 explicitly
            personaKey = "jethalal";
            logicLog.push("Low Savings & High Wants -> Jethalal");
        }
        else if (needs > 70) {
            if (ageGroup === "60+") {
                personaKey = "champaklal";
                logicLog.push("High Needs (>70%) + Senior -> Champaklal");
            } else {
                personaKey = "abdul"; // The Gig Survivor
                logicLog.push("High Needs (>70%) -> Abdul");
            }
        }
        // 2. SAVING VECTORS (Savings Dominant > 40%)
        else if (checkSavings > 40) {
            // CHAMPAKLAL BOOST: Age 60+ Savers
            if (ageGroup === "60+") {
                personaKey = "champaklal";
                logicLog.push("High Savings + Senior -> Champaklal");
            }
            else if (checkSavings > 72) {
                personaKey = "popatlal"; // The Hoarder
                logicLog.push("Extreme Savings (>72%) -> Popatlal");
            }
            // SPECIFIC GOAL SPECIALISTS
            else if ((hasGoal("wealth") || hasGoal("retirement")) && checkSavings >= 50) {
                personaKey = "iyer"; // The Investor
                logicLog.push("High Savings + Wealth Goal -> Iyer");
            } else if ((hasGoal("home") || hasGoal("asset")) && checkSavings >= 50) {
                personaKey = "sodhi"; // Real Estate
                logicLog.push("High Savings + Asset Goal -> Sodhi");
            } else if (hasGoal("safety") && checkSavings >= 50) {
                personaKey = "bhide"; // Conservative
                logicLog.push("High Savings + Safety Goal -> Bhide");
            } else {
                // Efficient Saver / Side Hustler
                personaKey = "madhavi";
                logicLog.push("High Savings (General) -> Madhavi");
            }
        }
        // 3. SPENDING VECTORS (Wants Dominant > 38%)
        else if (wants > 38) {
            // Granular Analysis
            const traits = [
                { key: 'babita', val: granular.shop || 0, label: 'Shopping' },
                { key: 'roshan', val: granular.dine || 0, label: 'Dining' },
                { key: 'daya', val: granular.trav || 0, label: 'Travel' },
                { key: 'tapu', val: granular.ent || 0, label: 'Entertainment' },
                { key: 'anjali', val: granular.health || 0, label: 'Health' }
            ];

            traits.sort((a, b) => b.val - a.val);
            let winner = traits[0];

            if (winner.val > 18) {
                personaKey = winner.key;
                logicLog.push(`Dominant Want: ${winner.label} -> ${winner.key}`);
            } else {
                personaKey = "komal"; // Comfort Seeker (Generalist)
                logicLog.push("High Wants / No Peak -> Komal");
            }
        }
        // 4. BALANCED / SPECIAL CASES
        else {
            // BAGHA logic only here
            if ((Math.abs(needs - wants) < 10 && Math.abs(wants - checkSavings) < 15) || (checkSavings >= 25 && checkSavings < 32)) {
                personaKey = "bagha";
                logicLog.push("Balanced/Indecisive -> Bagha");
            }
            // METHA (The Advisor)
            else {
                personaKey = "mehta";
                logicLog.push("Balanced/Moderate -> Mehta");
            }
        }

        return {
            key: personaKey,
            log: logicLog,
            effectiveSavings: effectiveSavings
        };
    };

    // ===================================
    // 2. FINANCIAL PRESCRIPTION LOGIC
    // ===================================
    ForensicsEngine.generateFinancialPrescription = function (dataEngine, ageRange, income, goalIdsInput, savingsRate, emiRate, macroData) {
        // Normalize
        const goalIds = Array.isArray(goalIdsInput) ? goalIdsInput : [goalIdsInput];
        let totalMonthlySIP = 0;
        let totalCorpus = 0;
        let blendedEquity = 0, blendedDebt = 0, blendedGold = 0, blendedCash = 0;
        let primaryGoalLabel = "";
        let taxTips = [];
        let summaries = [];

        if (goalIds.length === 0) return null;

        // Iterate and Blend
        goalIds.forEach((gid, index) => {
            const goal = dataEngine.ALL_GOALS[gid];
            if (!goal) return;

            if (index === 0) primaryGoalLabel = goal.label; // Use first as label
            taxTips.push(goal.tax_efficiency || "Review Tax rules.");

            // 1. Determine Horizon
            let horizon = "MEDIUM";
            if (goal.horizon.includes("Short")) horizon = "SHORT";
            else if (goal.horizon.includes("Long")) horizon = "LONG";

            // 2. Determine Risk Profile
            let risk = "AGGRESSIVE"; // Base
            if (["36-45", "46-60", "40-60", "60+"].includes(ageRange)) risk = "MODERATE";
            if (goal.priority === "Critical" || goal.category === "Essential") {
                risk = (horizon === "SHORT") ? "CONSERVATIVE" : "MODERATE";
            }
            if (emiRate > 30) risk = "CONSERVATIVE";

            // 3. Asset Allocation Matrix
            let allocation = { equity: 0, debt: 0, gold: 0, cash: 0, reco: "" };
            const matrixKey = `${horizon}-${risk}`;

            switch (matrixKey) {
                case "SHORT-CONSERVATIVE": allocation = { equity: 5, debt: 55, gold: 5, cash: 35, reco: "Liquid Funds" }; break;
                case "SHORT-MODERATE": allocation = { equity: 15, debt: 70, gold: 10, cash: 5, reco: "Debt Funds" }; break;
                case "SHORT-AGGRESSIVE": allocation = { equity: 60, debt: 30, gold: 10, cash: 0, reco: "Arbitrage" }; break;
                case "MEDIUM-CONSERVATIVE": allocation = { equity: 35, debt: 50, gold: 15, cash: 0, reco: "Conservative Hybrid" }; break;
                case "MEDIUM-MODERATE": allocation = { equity: 60, debt: 30, gold: 10, cash: 0, reco: "Balanced Advantage" }; break;
                case "MEDIUM-AGGRESSIVE": allocation = { equity: 75, debt: 15, gold: 10, cash: 0, reco: "Flexi-Cap" }; break;
                case "LONG-CONSERVATIVE": allocation = { equity: 45, debt: 45, gold: 10, cash: 0, reco: "Index + Bonds" }; break;
                case "LONG-MODERATE": allocation = { equity: 70, debt: 20, gold: 10, cash: 0, reco: "Large/Mid Cap" }; break;
                case "LONG-AGGRESSIVE": allocation = { equity: 85, debt: 10, gold: 5, cash: 0, reco: "Mid/Small Cap" }; break;
                default: allocation = { equity: 50, debt: 40, gold: 10, cash: 0, reco: "Balanced" };
            }

            // Accumulate for Blending (Simple Average for now)
            blendedEquity += allocation.equity;
            blendedDebt += allocation.debt;
            blendedGold += allocation.gold;
            blendedCash += allocation.cash;

            // 4. Projections Per Goal
            let inflation = 0.06;
            let debtReturn = 0.07;
            let cashReturn = 0.04;
            if (macroData) {
                inflation = macroData.inflation || 0.06;
                const rf = (macroData.riskFree || 6.67) / 100;
                debtReturn = rf + 0.005;
                cashReturn = rf - 0.015;
            }

            const years = (horizon === "SHORT") ? 2 : (horizon === "MEDIUM") ? 5 : 15;
            // Split monthly savings across goals? 
            // Assumption: User allocates EQUALLY to all selected goals for this simulation
            const monthlyInv = (income * savingsRate) / 100 / goalIds.length;

            const expReturn = (allocation.equity * 0.12 + allocation.debt * debtReturn + allocation.gold * 0.08 + allocation.cash * cashReturn) / 100;
            const months = years * 12;
            const r = expReturn / 12;
            let fv = 0;
            if (r > 0) fv = monthlyInv * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
            else fv = monthlyInv * months;

            totalMonthlySIP += monthlyInv;
            totalCorpus += fv;
            summaries.push(`${goal.label}: ₹${Math.round(fv / 100000)}L`);
        });

        // Average the Allocation
        const count = goalIds.length;
        const finalAlloc = {
            equity: Math.round(blendedEquity / count),
            debt: Math.round(blendedDebt / count),
            gold: Math.round(blendedGold / count),
            cash: Math.round(blendedCash / count),
            reco: "Blended Strategy for Multiple Goals"
        };
        // Normalize to 100% strictly
        const sum = finalAlloc.equity + finalAlloc.debt + finalAlloc.gold + finalAlloc.cash;
        if (sum !== 100) finalAlloc.equity += (100 - sum);

        return {
            goal: { label: goalIds.length > 1 ? `Multi-Goal (${goalIds.length})` : primaryGoalLabel },
            horizon: "VARIES",
            risk: "BLENDED",
            allocation: finalAlloc,
            projections: {
                years: 5, // Avg
                monthly_sip: totalMonthlySIP,
                projected_corpus: Math.round(totalCorpus),
                inflation_rate: "6.00%"
            },
            tax_planning: taxTips.join(" | "),
            rebalancing_advice: "Annual Portfolio Review required for Multi-Goal strategy."
        };
    };

    // EXPORT
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ForensicsEngine;
    } else {
        global.FORENSICS_ENGINE = ForensicsEngine;
    }

})(typeof window !== 'undefined' ? window : this);
