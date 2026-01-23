
const PERSONAS = [
    "poo", "bunny", "geet", "raj",
    "pushpa", "raju", "baburao", "shyam",
    "chatur", "rancho", "farhan", "simran",
    "munna", "circuit", "rani", "veeru"
];

const DATA_ENGINE = {
    STATE_MULTIPLIERS: {
        "andhra-pradesh": 1.05, "arunachal-pradesh": 0.95, "assam": 0.95, "bihar": 0.75,
        "chhattisgarh": 0.8, "goa": 1.3, "gujarat": 1.05, "haryana": 1.15,
        "himachal-pradesh": 1.0, "jharkhand": 0.85, "karnataka": 1.35, "kerala": 1.05,
        "madhya-pradesh": 0.85, "maharashtra": 1.4, "manipur": 0.9, "meghalaya": 0.95,
        "mizoram": 0.9, "nagaland": 0.9, "odisha": 0.8, "punjab": 1.05, "rajasthan": 0.95,
        "sikkim": 1.1, "tamil-nadu": 1.05, "telangana": 1.2, "tripura": 0.85,
        "uttar-pradesh": 0.85, "uttarakhand": 1.0, "west-bengal": 1.0, "delhi": 1.35,
        "mumbai": 1.5
    }
};

function determinePersona(inputs) {
    const { salary, stateMultiplier, needs, wants, savings, granular } = inputs;

    // 1. PPP Calculation
    const ppp = salary / stateMultiplier;
    let pppTier = "MID_LOW";
    if (ppp < 600000) pppTier = "LOW";
    else if (ppp < 1200000) pppTier = "MID_LOW";
    else if (ppp < 2500000) pppTier = "MID_HIGH";
    else pppTier = "HIGH";

    // 2. Behavioral Clustering
    let behavior = "BALANCED";

    // TUNED V3: Wants > 30 (was 25)
    if (wants > 30) behavior = "SPENDER";
    else if (savings > 30) behavior = "SAVER";
    else if (needs > 55) behavior = "SURVIVOR"; // TUNED V3: > 55 (was 60)
    else behavior = "BALANCED";

    // 3. Granular Winner
    let dominantWant = "generic";
    let maxVal = 0;
    for (const [key, val] of Object.entries(granular)) {
        if (val > maxVal) {
            maxVal = val;
            dominantWant = key;
        }
    }

    // ==========================================
    // FINAL MAPPING LOGIC (TUNED V3)
    // ==========================================

    if (pppTier === "HIGH") { // > 25L
        if (behavior === "SPENDER") {
            if (dominantWant === "shopping") return "poo";
            if (dominantWant === "travel") return "bunny";
            if (dominantWant === "entertainment") return "raj";
            return "chatur";
        }
        if (behavior === "SAVER") {
            if (savings > 50) return "rancho";
            return "farhan";
        }
        return "raj";
    }

    if (pppTier === "MID_HIGH") { // 12L-25L
        if (behavior === "SPENDER") {
            if (dominantWant === "shopping" && granular.shopping > 35) return "poo";
            if (dominantWant === "shopping") return "chatur";
            if (dominantWant === "travel") return "geet";
            if (dominantWant === "dining") return "munna";
            return "geet";
        }
        if (behavior === "SAVER") {
            if (granular.travel > 15) return "rani";
            return "simran";
        }
        if (behavior === "SURVIVOR") return "shyam";
        return "farhan";
    }

    if (pppTier === "MID_LOW") { // 6L-12L
        if (behavior === "SPENDER") {
            // TUNED V3: Steal from Raju
            if (dominantWant === "dining" || granular.dining > 20) return "munna";
            if (dominantWant === "entertainment" || granular.entertainment > 20) return "veeru";
            if (dominantWant === "travel") return "bunny";

            if (needs < 45) return "raju";
            return "raju";
        }
        if (behavior === "SAVER") {
            if (savings > 40) return "simran";
            return "shyam";
        }
        if (behavior === "SURVIVOR") {
            // TUNED V3: Relaxed Circuit
            if (granular.dining > 5) return "circuit";
            return "pushpa";
        }
        return "shyam";
    }

    if (pppTier === "LOW") { // < 6L
        if (behavior === "SPENDER") return "raju";
        if (behavior === "SAVER") return "baburao";
        if (behavior === "SURVIVOR") {
            // TUNED V3: Relaxed Pushpa
            if (needs > 65) return "pushpa";
            return "circuit";
        }
        return "baburao";
    }

    return "shyam";
}

function runSimulation() {
    const iterations = 5;
    const totalUsersPerRun = 10000;
    const aggregateResults = {};
    PERSONAS.forEach(p => aggregateResults[p] = 0);

    console.log(`Starting ${iterations} runs of ${totalUsersPerRun} users each...`);

    for (let run = 1; run <= iterations; run++) {
        const runResults = {};
        PERSONAS.forEach(p => runResults[p] = 0);

        for (let i = 0; i < totalUsersPerRun; i++) {
            // Fintech User Distribution (Skewed towards Mid)
            let salary;
            const rand = Math.random();
            if (rand < 0.20) salary = 300000 + Math.random() * 300000; // 20% Low (<6L)
            else if (rand < 0.55) salary = 600000 + Math.random() * 600000; // 35% Mid-Low (6-12L)
            else if (rand < 0.85) salary = 1200000 + Math.random() * 1300000; // 30% Mid-High (12-25L)
            else salary = 2500000 + Math.random() * 5000000; // 15% High (>25L)

            const stateKeys = Object.keys(DATA_ENGINE.STATE_MULTIPLIERS);
            const stateKey = stateKeys[Math.floor(Math.random() * stateKeys.length)];
            const stateMultiplier = DATA_ENGINE.STATE_MULTIPLIERS[stateKey];

            const needs = Math.random() * (80 - 30) + 30;
            const remaining = 100 - needs;
            const wants = Math.random() * remaining;
            const savings = remaining - wants;

            const g1 = Math.random(); const g2 = Math.random();
            const g3 = Math.random(); const g4 = Math.random();
            const gTotal = g1 + g2 + g3 + g4;

            const granular = {
                shopping: (g1 / gTotal) * 100, dining: (g2 / gTotal) * 100,
                travel: (g3 / gTotal) * 100, entertainment: (g4 / gTotal) * 100
            };

            const persona = determinePersona({ salary, stateMultiplier, needs, wants, savings, granular });
            runResults[persona]++;
            aggregateResults[persona]++;
        }
        console.log(`Run ${run} Complete.`);
    }

    console.log("\nAVERAGE DISTRIBUTION (Across 5 Runs):");
    console.log("-------------------------------------");
    const totalSamples = iterations * totalUsersPerRun;

    Object.entries(aggregateResults)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, count]) => {
            const avgPct = ((count / totalSamples) * 100).toFixed(2);
            console.log(`${key.padEnd(10)}: ${avgPct}%`);
        });
}

runSimulation();
