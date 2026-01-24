
const ForensicsEngine = {};

// ===================================
// CHARACTER VECTORS - 6 Behavioral Dimensions
// Used for: similarity scoring, closest matches, explanations
// ===================================
// Dimensions:
// 1. Risk Tolerance (0-100): FD lover ↔ Crypto lover
// 2. Time Preference (0-100): Instant gratification ↔ Long-term planner
// 3. Social Spending (0-100): Individual ↔ Spends on others
// 4. Status Seeking (0-100): Anti-brand ↔ Brand obsessed
// 5. Financial Anxiety (0-100): Carefree ↔ Always worried
// 6. Savings Discipline (0-100): Zero savings ↔ Aggressive saver

const CHARACTER_VECTORS = {
    poo: [40, 30, 45, 85, 25, 15],    // Status queen
    chatur: [50, 55, 35, 70, 45, 40],    // Competitive flexer
    raj: [55, 40, 70, 55, 20, 25],    // Rich lifestyle
    bunny: [65, 20, 55, 40, 35, 20],    // Travel FOMO
    geet: [55, 15, 50, 45, 30, 15],    // Impulsive
    rani: [55, 50, 50, 35, 40, 45],    // Smart traveler
    raju: [90, 10, 45, 45, 70, 5],     // Scheme chaser
    veeru: [85, 15, 55, 40, 55, 10],    // Gambler
    baburao: [10, 90, 25, 10, 85, 90],    // Ultra frugal
    shyam: [35, 60, 40, 30, 55, 55],    // Steady balanced
    simran: [25, 75, 50, 30, 60, 65],    // Traditional saver
    rancho: [40, 80, 30, 10, 15, 75],    // Minimalist genius
    munna: [50, 30, 90, 35, 45, 20],    // Social spender
    circuit: [25, 25, 75, 20, 65, 15],    // Follower
    pushpa: [65, 55, 40, 50, 80, 35],    // Anxious hustler
    farhan: [45, 60, 55, 20, 45, 40],    // Passion chaser
};

// ===================================
// COSINE SIMILARITY
// ===================================
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ===================================
// BUILD USER VECTOR FROM INPUTS
// ===================================
function buildUserVector(needs, wants, savings, granular) {
    const dining = granular?.dining || 0;
    const travel = granular?.travel || 0;
    const shopping = granular?.shopping || 0;
    const entertainment = granular?.entertainment || 0;
    const invest = granular?.invest || savings;

    const riskTolerance = Math.min(100, Math.max(0, (wants * 1.5) + (travel * 0.8) - (savings * 0.8) + 25));
    const timePreference = Math.min(100, Math.max(0, (savings * 1.8) - (wants * 0.5) + 20));
    const socialSpending = Math.min(100, Math.max(0, (dining * 2) + (entertainment * 1.5) + (travel * 0.5) + 15));
    const statusSeeking = Math.min(100, Math.max(0, (shopping * 2.5) + (wants * 0.3) + 15));
    const financialAnxiety = Math.min(100, Math.max(0, (needs * 1.2) - (savings * 0.4) + 15));
    const savingsDiscipline = Math.min(100, Math.max(0, (savings * 1.8) + (invest * 0.5)));

    return [riskTolerance, timePreference, socialSpending, statusSeeking, financialAnxiety, savingsDiscipline];
}

// ===================================
// MAIN PERSONA DETERMINATION
// Hybrid: Behavioral buckets + Vector similarity for ties
// ===================================
ForensicsEngine.determinePersona = function (dataEngine, salaryInput, state, ageGroup, needs, wants, savings, goalsInput, granular, accumulatedCCTotal = 0) {
    let logicLog = [];
    let personaKey = "shyam"; // Default

    // Extract granular values
    const dining = granular?.dining || 0;
    const travel = granular?.travel || 0;
    const shopping = granular?.shopping || 0;
    const entertainment = granular?.entertainment || 0;

    // Build user vector for similarity scoring
    const userVector = buildUserVector(needs, wants, savings, granular);
    logicLog.push(`Vector: [${userVector.map(v => v.toFixed(0)).join(', ')}]`);

    // === BEHAVIORAL BUCKET LOGIC ===
    // Classify primary behavior
    let behavior = "BALANCED";
    if (wants > 35) behavior = "SPENDER";
    else if (savings > 35) behavior = "SAVER";
    else if (needs > 60) behavior = "SURVIVOR";

    // Find dominant want category
    let dominantWant = "generic";
    const wantCategories = { shopping, travel, dining, entertainment };
    const maxWant = Math.max(...Object.values(wantCategories));
    if (maxWant >= 15) {
        dominantWant = Object.entries(wantCategories).find(([k, v]) => v === maxWant)?.[0] || "generic";
    }

    logicLog.push(`Behavior: ${behavior}, Dominant: ${dominantWant}`);

    // === CHARACTER SELECTION ===
    if (behavior === "SPENDER") {
        if (dominantWant === "shopping") {
            personaKey = shopping > 25 ? "poo" : "chatur";
        } else if (dominantWant === "travel") {
            personaKey = "bunny";
        } else if (dominantWant === "dining") {
            personaKey = "munna";
        } else if (dominantWant === "entertainment") {
            personaKey = wants > 40 ? "veeru" : "geet";
        } else {
            // High wants but no clear dominant - use risk profile
            personaKey = savings < 15 ? "raju" : "raj";
        }
    } else if (behavior === "SAVER") {
        if (savings > 50) {
            personaKey = needs > 50 ? "baburao" : "rancho";
        } else if (dominantWant === "travel" && travel > 10) {
            personaKey = "rani";
        } else if (dominantWant === "dining" || socialSpending > 40) {
            personaKey = "simran";
        } else {
            personaKey = entertainment > 10 ? "farhan" : "shyam";
        }
    } else if (behavior === "SURVIVOR") {
        if (savings > 15) {
            personaKey = "pushpa";
        } else if (dining > 10 || entertainment > 10) {
            personaKey = "circuit";
        } else {
            personaKey = needs > 70 ? "pushpa" : "circuit";
        }
    } else {
        // BALANCED - use vector matching
        const scores = {};
        for (const [charKey, charVector] of Object.entries(CHARACTER_VECTORS)) {
            scores[charKey] = cosineSimilarity(userVector, charVector);
        }
        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        personaKey = sorted[0][0];
        logicLog.push(`Vector match: ${personaKey} (${(sorted[0][1] * 100).toFixed(1)}%)`);
    }

    logicLog.push(`Final: ${personaKey}`);

    // Calculate closest matches using vector similarity
    const allScores = {};
    for (const [charKey, charVector] of Object.entries(CHARACTER_VECTORS)) {
        allScores[charKey] = cosineSimilarity(userVector, charVector);
    }
    const sortedAll = Object.entries(allScores).sort((a, b) => b[1] - a[1]);
    const closestMatches = sortedAll
        .filter(([k]) => k !== personaKey)
        .slice(0, 3)
        .map(([k, s]) => ({ key: k, score: Math.round(s * 100) }));

    // State multiplier for effective savings
    let stateMultiplier = 1.0;
    if (state && typeof state === 'string' && dataEngine?.STATE_MULTIPLIERS) {
        const stateKey = state.toLowerCase().replace(/\s+/g, '-');
        stateMultiplier = dataEngine.STATE_MULTIPLIERS[stateKey] || 1.0;
    }

    return {
        key: personaKey,
        log: logicLog,
        effectiveSavings: savings * stateMultiplier,
        confidence: Math.round((allScores[personaKey] || 0.8) * 100),
        userVector: userVector,
        closestMatches: closestMatches
    };
};

// ===================================
// BEHAVIORAL DIMENSION EXPLANATIONS
// ===================================
ForensicsEngine.explainDimensions = function (userVector) {
    const labels = ['Risk Tolerance', 'Time Preference', 'Social Spending', 'Status Seeking', 'Financial Anxiety', 'Savings Discipline'];
    const explanations = [
        userVector[0] > 60 ? "You're comfortable taking financial risks." : "You prefer safe, guaranteed returns.",
        userVector[1] > 60 ? "You think long-term - retirement planning suits you." : "You value experiences NOW.",
        userVector[2] > 60 ? "You love spending on friends and social activities." : "You spend more on yourself.",
        userVector[3] > 60 ? "Brands and status symbols matter to you." : "You value function over brand names.",
        userVector[4] > 60 ? "Money worries keep you up at night." : "You're financially relaxed.",
        userVector[5] > 60 ? "You're a disciplined saver!" : "Saving isn't your strong suit yet."
    ];

    return labels.map((label, i) => ({
        label,
        value: Math.round(userVector[i]),
        explanation: explanations[i]
    }));
};

// ===================================
// FINANCIAL PRESCRIPTION (Unchanged)
// ===================================
ForensicsEngine.generateFinancialPrescription = function (dataEngine, ageRange, income, goalIdsInput, savingsRate, emiRate, macroData) {
    const goalIds = Array.isArray(goalIdsInput) ? goalIdsInput : [goalIdsInput];
    const pGoalId = goalIds[0] || "wealth";
    const pGoal = dataEngine?.ALL_GOALS?.[pGoalId] || { label: "Wealth Building", alloc: { equity: 60, debt: 30, gold: 10 } };

    let targetEquity = pGoal.alloc.equity;
    let targetDebt = pGoal.alloc.debt;
    let targetGold = pGoal.alloc.gold;

    if (savingsRate > 40) {
        targetEquity += 5;
        targetDebt -= 5;
    } else if (savingsRate < 10) {
        targetEquity -= 10;
        targetDebt += 10;
    }

    targetEquity = Math.max(10, Math.min(90, targetEquity));
    targetDebt = Math.max(5, Math.min(90, targetDebt));
    targetGold = 100 - targetEquity - targetDebt;

    return {
        equity: targetEquity,
        debt: targetDebt,
        gold: targetGold,
        reco: `Optimized for ${pGoal.label}`,
        confidence: "High",
        allocation: { equity: targetEquity, debt: targetDebt, gold: targetGold }
    };
};

// Export
if (typeof window !== 'undefined') {
    window.FORENSICS_ENGINE = ForensicsEngine;
    window.CHARACTER_VECTORS = CHARACTER_VECTORS;
} else if (typeof module !== 'undefined') {
    module.exports = { ForensicsEngine, CHARACTER_VECTORS };
}
