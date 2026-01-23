
const PERSONAS = [
    "poo", "bunny", "geet", "raj",
    "pushpa", "raju", "baburao", "shyam",
    "chatur", "rancho", "farhan", "simran",
    "munna", "circuit", "rani", "veeru"
];

const DATA_ENGINE = {
    STATE_MULTIPLIERS: { "generic": 1.0, "mumbai": 1.5, "bihar": 0.75 }
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

function runMonteCarlo() {
    const N = 50000;
    console.log(`Running Monte Carlo Simulation (N=${N}) with UNIFORM Inputs...`);

    const results = {};
    PERSONAS.forEach(p => results[p] = 0);

    for (let i = 0; i < N; i++) {
        // UNIFORM INPUTS FOR FAIRNESS TEST
        let salary;
        const tierRand = Math.random();
        if (tierRand < 0.25) salary = Math.random() * 600000;
        else if (tierRand < 0.50) salary = 600000 + Math.random() * 600000;
        else if (tierRand < 0.75) salary = 1200000 + Math.random() * 1300000;
        else salary = 2500000 + Math.random() * 2500000;

        let r1 = Math.random(), r2 = Math.random(), r3 = Math.random();
        let total = r1 + r2 + r3;
        let needs = (r1 / total) * 100;
        let wants = (r2 / total) * 100;
        let savings = (r3 / total) * 100;

        let g1 = Math.random(), g2 = Math.random(), g3 = Math.random(), g4 = Math.random();
        let gt = g1 + g2 + g3 + g4;
        const granular = {
            shopping: (g1 / gt) * 100, dining: (g2 / gt) * 100,
            travel: (g3 / gt) * 100, entertainment: (g4 / gt) * 100
        };

        const persona = determinePersona({ salary, stateMultiplier: 1.0, needs, wants, savings, granular });
        results[persona]++;
    }

    console.log("\nMONTE CARLO V3 RESULTS:");
    console.log("-----------------------");
    Object.entries(results).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        const pct = ((v / N) * 100).toFixed(2);
        console.log(`${k.padEnd(10)}: ${pct}%`);
    });
}

runMonteCarlo();
