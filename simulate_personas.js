
const DATA_ENGINE = {
    STATE_MULTIPLIERS: {
        "andaman-&-nicobar-islands": 1.21, "andhra-pradesh": 1.27, "arunachal-pradesh": 1.17,
        "assam": 1.07, "bihar": 1.12, "chandigarh": 0.89, "chhattisgarh": 0.93,
        "dadra-&-nagar-haveli-&-daman-&-diu": 0.68, "delhi": 0.94, "goa": 0.96,
        "gujarat": 1.06, "haryana": 0.99, "himachal-pradesh": 0.90, "jammu-&-kashmir": 0.92,
        "jharkhand": 0.97, "karnataka": 0.92, "kerala": 0.92, "ladakh": 1.50,
        "lakshadweep": 1.18, "madhya-pradesh": 0.93, "maharashtra": 0.88, "manipur": 1.78,
        "meghalaya": 1.35, "mizoram": 1.65, "nagaland": 1.74, "odisha": 0.99,
        "puducherry": 0.95, "punjab": 1.16, "rajasthan": 1.08, "sikkim": 1.20,
        "tamil-nadu": 1.05, "telangana": 1.08, "tripura": 1.19, "uttar-pradesh": 1.02,
        "uttarakhand": 0.90, "west-bengal": 1.26
    },
    PERSONAS: { /* Keys only for validation */
        "jethalal": {}, "bhide": {}, "popatlal": {}, "babita": {}, "iyer": {},
        "sodhi": {}, "daya": {}, "tapu": {}, "anjali": {}, "mehta": {},
        "komal": {}, "madhavi": {}, "champaklal": {}, "natukaka": {},
        "bagha": {}, "roshan": {}, "abdul": {}
    }
};

// ==========================================
// LOGIC COPY FROM SCRIPT.JS (For Fidelity)
// ==========================================
function getPersona(inputs) {
    let { needs, wants, savings, goal, ageGroup, granular, stateInput } = inputs;
    let personaKey = "mehta";
    let logicLog = [];

    // 0. COST OF LIVING ADJUSTMENT
    const userStateInput = stateInput.toLowerCase();
    let stateMultiplier = 1.0;

    if (DATA_ENGINE.STATE_MULTIPLIERS && DATA_ENGINE.STATE_MULTIPLIERS[userStateInput]) {
        stateMultiplier = DATA_ENGINE.STATE_MULTIPLIERS[userStateInput];
    } else {
        // Fallback search
        for (const [key, val] of Object.entries(DATA_ENGINE.STATE_MULTIPLIERS || {})) {
            if (userStateInput.includes(key)) {
                stateMultiplier = val;
                break;
            }
        }
    }

    const rawSavings = savings;
    const effectiveSavings = rawSavings / stateMultiplier;

    // CRITICAL: Update 'savings' used in logic
    savings = effectiveSavings;

    // 1. SURVIVAL VECTORS (Needs Dominant > 70%)
    if (needs > 70) {
        if (ageGroup === "60+") {
            personaKey = "champaklal";
        } else {
            personaKey = "abdul"; // High Needs -> Gig Economy/Survivor
        }
    }
    // 2. SAVING VECTORS (Savings Dominant > 40%)
    else if (savings > 40) {
        if (ageGroup === "60+") {
            personaKey = "champaklal";
        }
        else if (savings > 72) {
            personaKey = "popatlal";
        }
        else if ((goal === "wealth" || goal === "retirement") && savings > 50) {
            personaKey = "iyer";
        } else if ((goal === "home" || goal === "asset") && savings > 50) {
            personaKey = "sodhi";
        } else if (goal === "safety" && savings > 50) {
            personaKey = "bhide";
        }
        else {
            // "Madhavi" rescues everyone else in the 40-70% savings bracket who doesn't match specific goals
            // OR those >50% who picked other goals like Travel/Lifestyle
            personaKey = "madhavi";
        }
    }
    // 3. SPENDING VECTORS (Wants Dominant > 38%)
    else if (wants > 38) {
        const traits = [
            { key: 'babita', val: granular.shop, label: 'Shopping' },
            { key: 'roshan', val: granular.dine, label: 'Dining' },
            { key: 'daya', val: granular.trav, label: 'Travel' },
            { key: 'tapu', val: granular.ent, label: 'Entertainment' },
            { key: 'anjali', val: granular.health || 0, label: 'Health' }
        ];

        // Sort desc
        traits.sort((a, b) => b.val - a.val);
        let winner = traits[0];

        if (winner.val > 18) {
            personaKey = winner.key;
        } else {
            // High wants but distributed = Komal
            personaKey = "komal";
        }
    }
    // 4. BALANCED/UNIQUE VECTORS
    else {
        if (savings < 25) {
            personaKey = "jethalal";
        }
        else if ((Math.abs(needs - wants) < 10 && Math.abs(wants - effectiveSavings) < 15) || (effectiveSavings >= 25 && effectiveSavings < 32)) {
            personaKey = "bagha";
        }
        else {
            personaKey = "mehta";
        }
    }

    return personaKey;
}

// ==========================================
// SIMULATION RUNNER (HUMAN BEHAVIOR MODEL)
// ==========================================
const ITERATIONS = 10000;
const results = {};
const states = Object.keys(DATA_ENGINE.STATE_MULTIPLIERS);
const goals = ["wealth", "home", "safety", "lifestyle", "retirement", "asset"];
const ageGroups = ["18-22", "22-28", "29-39", "40-60", "60+"];

console.log(`Running ${ITERATIONS} simulations (3-Bucket Simplex)...`);

for (let i = 0; i < ITERATIONS; i++) {
    // 1. Uniform Simplex Sampling for Needs/Wants/Savings
    let c1 = Math.random() * 100;
    let c2 = Math.random() * 100;
    let min = Math.min(c1, c2);
    let max = Math.max(c1, c2);

    let calc_needs = min;
    let calc_wants = max - min;
    let calc_savings = 100 - max;

    // 2. Randomize Other Inputs
    let state = states[Math.floor(Math.random() * states.length)];
    let goal = goals[Math.floor(Math.random() * goals.length)];
    let age = ageGroups[Math.floor(Math.random() * ageGroups.length)];

    // 3. Granular Wants
    let r1 = Math.random(); let r2 = Math.random(); let r3 = Math.random(); let r4 = Math.random(); let r5 = Math.random();
    let sumW = r1 + r2 + r3 + r4 + r5;

    let granular = {
        shop: (r1 / sumW) * calc_wants,
        dine: (r2 / sumW) * calc_wants,
        trav: (r3 / sumW) * calc_wants,
        ent: (r4 / sumW) * calc_wants,
        health: (r5 / sumW) * calc_wants
    };

    let key = getPersona({
        needs: calc_needs,
        wants: calc_wants,
        savings: calc_savings,
        goal: goal,
        ageGroup: age,
        granular: granular,
        stateInput: state
    });

    results[key] = (results[key] || 0) + 1;
}

console.log("\n--- DISTRIBUTION (Count | % of 10000) ---");
let sorted = Object.entries(results).sort((a, b) => b[1] - a[1]);
sorted.forEach(([k, v]) => {
    console.log(`${k.padEnd(12)}: ${v.toString().padEnd(5)} (${(v / 100).toFixed(1)}%)`);
});
