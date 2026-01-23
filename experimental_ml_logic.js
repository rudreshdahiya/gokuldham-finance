
const PERSONAS = [
    "poo", "bunny", "geet", "raj",
    "pushpa", "raju", "baburao", "shyam",
    "chatur", "rancho", "farhan", "simran",
    "munna", "circuit", "rani", "veeru"
];

// 1. Define Centroids (The "Platonic Ideal" for each Persona)
// Scale: 0-100 for all dimensions
// Dims: [PPP_Score, Needs, Wants, Savings, Shop, Dine, Travel, Ent]
// PPP Score: Low(<6L)=10, MidLow(6-12L)=35, MidHigh(12-25L)=65, High(>25L)=90
const CENTROIDS = {
    // HIGH PPP (Rich)
    "poo": [90, 20, 70, 10, 80, 20, 0, 0],  // Shopping Queen
    "bunny": [80, 20, 60, 20, 10, 20, 70, 0],  // Traveler
    "raj": [90, 30, 50, 20, 20, 30, 20, 30], // Balanced Rich Spender
    "chatur": [85, 20, 60, 20, 50, 30, 10, 10], // Status (Mix of shop/dine)
    "rancho": [90, 10, 10, 80, 0, 0, 50, 50], // Minimalist Genius (High Savings)
    "farhan": [70, 40, 30, 30, 10, 10, 40, 40], // Passion Chaser (Mid-High)

    // MID PPP
    "geet": [65, 30, 60, 10, 20, 10, 60, 10], // Impulsive Spender
    "simran": [60, 30, 20, 50, 20, 20, 20, 40], // Disciplined Saver
    "rani": [65, 30, 20, 50, 0, 0, 80, 20], // Saver for Travel
    "munna": [50, 40, 50, 10, 10, 70, 0, 20], // Social Spender (Dine)
    "shyam": [45, 50, 20, 30, 0, 0, 0, 0], // Steady Job (Balanced)
    "veeru": [40, 40, 50, 10, 0, 10, 0, 90], // Gambler/Risk (Ent)

    // LOW PPP
    "raju": [20, 50, 45, 5, 20, 20, 20, 40], // Poor but wants to spend
    "baburao": [15, 40, 10, 50, 0, 0, 0, 0], // Poor Saver
    "pushpa": [25, 80, 10, 10, 0, 0, 0, 0], // Survivor (Hard work)
    "circuit": [20, 60, 30, 10, 0, 60, 0, 40], // Loyal Follower (Spend on friends)
};

// State Multipliers for PPP Calculation
const STATE_MUL = { "mumbai": 1.5, "delhi": 1.35, "generic": 1.0, "rural": 0.8 };

function getEuclideanDistance(v1, v2) {
    let sum = 0;
    // Weighted Euclidean: Prioritize PPP (idx 0) and Savings (idx 3) slightly?
    // Let's stick to standard Euclidean first.
    for (let i = 0; i < v1.length; i++) {
        sum += Math.pow(v1[i] - v2[i], 2);
    }
    return Math.sqrt(sum);
}

function determinePersonaML(inputs) {
    const { salary, stateMultiplier, needs, wants, savings, granular } = inputs;

    // 1. Normalize PPP (Log Scale adaptation)
    const ppp = salary / stateMultiplier;
    let pppScore = 0;
    // Map 3L->10, 6L->30, 12L->50, 25L->75, 50L->95
    if (ppp < 300000) pppScore = 10;
    else if (ppp < 600000) pppScore = 25;
    else if (ppp < 1200000) pppScore = 45;
    else if (ppp < 2500000) pppScore = 65;
    else pppScore = 90;

    // Add some noise/gradient
    // Ideally use Math.log10(ppp) mapped to 0-100 range
    // pppScore = Math.min(100, Math.max(0, (Math.log10(ppp) - 5) * 40)); // Log(1L)=5->0, Log(1Cr)=7->80

    // 2. Input Vector
    // [PPP, N, W, S, Shop, Dine, Trav, Ent]
    // Granular inputs are % of TOTAL Income, or % of Wants?
    // In Centroids, I assumed 'Shop=80' means Shopping is dominant. 
    // Let's normalize Granular to be "Share of Wants" (0-100).

    const vector = [
        pppScore,
        needs,
        wants,
        savings,
        granular.shopping || 0,
        granular.dining || 0,
        granular.travel || 0,
        granular.entertainment || 0
    ];

    // 3. Find Nearest Centroid
    let minDist = Infinity;
    let winner = "shyam";

    for (const [key, centroid] of Object.entries(CENTROIDS)) {
        const dist = getEuclideanDistance(vector, centroid);
        if (dist < minDist) {
            minDist = dist;
            winner = key;
        }
    }
    return winner;
}

// SIMULATION
function runSimulation() {
    console.log("Running ML (Nearest Centroid) Simulation...");
    const results = {};
    PERSONAS.forEach(p => results[p] = 0);
    const total = 5000;

    for (let i = 0; i < total; i++) {
        // Fintech User Gen
        let salary;
        const r = Math.random();
        if (r < 0.20) salary = 300000 + Math.random() * 300000; // 20% Low
        else if (r < 0.55) salary = 600000 + Math.random() * 600000; // 35% MidLow
        else if (r < 0.85) salary = 1200000 + Math.random() * 1300000; // 30% MidHigh
        else salary = 2500000 + Math.random() * 4000000; // 15% High

        const needs = Math.random() * 50 + 30; // 30-80
        const rem = 100 - needs;
        const wants = Math.random() * rem;
        const savings = rem - wants;

        // Granular (Sum to 100 of Wants)
        // If wants is 0, granular doesn't matter much (multiply by 0 weight?)
        // Centroids treat granular as 0-100 scale importance.
        // We should normalize user granular to 0-100 relative to each other.
        const g1 = Math.random(), g2 = Math.random(), g3 = Math.random(), g4 = Math.random();
        const gt = g1 + g2 + g3 + g4;
        const granular = {
            shopping: (g1 / gt) * 100,
            dining: (g2 / gt) * 100,
            travel: (g3 / gt) * 100,
            entertainment: (g4 / gt) * 100
        };

        const p = determinePersonaML({ salary, stateMultiplier: 1.2, needs, wants, savings, granular });
        results[p]++;
    }

    Object.entries(results).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        console.log(`${k.padEnd(10)}: ${((v / total) * 100).toFixed(2)}%`);
    });
}

runSimulation();
