// LOGIC CORE (V10.1: SPENDER BOOST)
function runLogic(age, needs, wants, savings, goal, income, granular) {
    let personaKey = "mehta";
    // Age Group Inference for Simulation
    let ageGroup = "22-29";
    if (age === "40-60") ageGroup = "40-60";
    if (age === "60+") ageGroup = "60+";

    // 1. SURVIVAL VECTORS (Needs Dominant > 60%)
    if (needs > 60) {
        if (ageGroup === "60+") {
            personaKey = "champaklal";
        } else if (ageGroup === "40-60") {
            personaKey = "natukaka";
        } else {
            personaKey = "abdul";
        }
    }
    // 2. SAVING VECTORS (Savings Dominant > 40%)
    else if (savings > 40) {
        if (savings > 72) { // 72% Threshold to KILL Popatlal dominance
            personaKey = "popatlal";
        } else if (goal === "wealth" || goal === "retirement") {
            personaKey = "iyer";
        } else if (goal === "home" || goal === "asset") {
            personaKey = "sodhi";
        } else if (goal === "safety" || goal === "debt") {
            personaKey = "bhide";
        } else {
            personaKey = "madhavi";
        }
    }
    // 3. SPENDING VECTORS (Wants Dominant > 38%)
    else if (wants > 38) { // Lowered to 38% to consume some Balanced Overflow
        // Sort granulars to find the distinct peak
        const traits = [
            { key: 'babita', val: granular.shop },
            { key: 'roshan', val: granular.dine },
            { key: 'daya', val: granular.trav },
            { key: 'tapu', val: granular.ent },
            { key: 'anjali', val: granular.health || 0 }
        ];

        traits.sort((a, b) => b.val - a.val);
        let winner = traits[0];

        if (winner.val > 12) {
            personaKey = winner.key;
        } else {
            personaKey = "komal";
        }
    }
    // 4. BALANCED/UNIQUE VECTORS
    else {
        // JETHALAL: Business Risk (< 30%)
        if (savings < 30) {
            personaKey = "jethalal";
        }
        else {
            // MEHTA: The Advisor (30% - 40%)
            personaKey = "mehta";
        }
    }

    return personaKey;
}

// SIMULATION HELPER
const ITERATIONS = 10000;
const GOALS = ["wealth", "retirement", "safety", "debt", "health_cover", "home", "asset", "lifestyle"];
const AGES = ["22-28", "29-39", "40-60", "60+"];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomProfile() {
    let a = getRandomInt(0, 100);
    let b = getRandomInt(0, 100);
    if (a > b) [a, b] = [b, a];
    let needs = a;
    let wants = b - a;
    let savings = 100 - b;

    // Granular Wants Split (Randomly biased)
    let remainW = wants;
    let bias = getRandomInt(0, 4);

    let s_dine = Math.floor(Math.random() * (remainW * (bias === 0 ? 0.8 : 0.3)));
    let s_trav = Math.floor(Math.random() * (remainW * (bias === 1 ? 0.8 : 0.3)));
    let s_shop = Math.floor(Math.random() * (remainW * (bias === 2 ? 0.8 : 0.3)));
    let s_ent = Math.floor(Math.random() * (remainW * (bias === 3 ? 0.8 : 0.3)));
    let s_health = Math.floor(Math.random() * (remainW * (bias === 4 ? 0.8 : 0.3)));

    const age = AGES[getRandomInt(0, AGES.length - 1)];
    const goal = GOALS[getRandomInt(0, GOALS.length - 1)];
    let income = 50000;

    return {
        age, needs, wants, savings, goal, income,
        granular: { dine: s_dine, trav: s_trav, shop: s_shop, ent: s_ent, health: s_health }
    };
}

// RUNNER
console.log(`\n=== V10.1 LOGIC VERIFICATION (${ITERATIONS} Users) ===`);
let stats = {};

for (let i = 0; i < ITERATIONS; i++) {
    const p = generateRandomProfile();
    const result = runLogic(p.age, p.needs, p.wants, p.savings, p.goal, p.income, p.granular);

    if (!stats[result]) {
        stats[result] = { count: 0, sumN: 0, sumW: 0, sumS: 0 };
    }
    stats[result].count++;
    stats[result].sumN += p.needs;
    stats[result].sumW += p.wants;
    stats[result].sumS += p.savings;
}

// REPORT GENERATION
console.log("\nPERSONA          | % SHARE | AVG DNA (Needs/Wants/Save)");
console.log("-".repeat(60));

let sorted = Object.entries(stats).sort((a, b) => b[1].count - a[1].count);

sorted.forEach(([key, data]) => {
    let pct = ((data.count / ITERATIONS) * 100).toFixed(1);
    let avgN = Math.round(data.sumN / data.count);
    let avgW = Math.round(data.sumW / data.count);
    let avgS = Math.round(data.sumS / data.count);

    let dna = `${avgN}% / ${avgW}% / ${avgS}%`;

    console.log(`${key.toUpperCase().padEnd(16)} | ${pct.padStart(5)}%  | ${dna.padEnd(20)}`);
});
