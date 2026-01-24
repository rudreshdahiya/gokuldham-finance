// Monte Carlo Test - HYBRID V5 (Fine-tuned thresholds)

const CHARACTER_VECTORS = {
    poo: [40, 30, 45, 80, 25, 15],
    chatur: [50, 50, 35, 65, 45, 40],
    raj: [55, 40, 70, 55, 20, 25],
    bunny: [65, 20, 55, 40, 35, 20],
    geet: [55, 15, 50, 45, 30, 15],
    rani: [55, 45, 50, 35, 40, 40],
    raju: [85, 15, 45, 45, 65, 10],
    veeru: [80, 20, 55, 40, 55, 15],
    baburao: [15, 80, 25, 10, 80, 85],
    shyam: [35, 55, 40, 30, 50, 50],
    simran: [30, 65, 50, 30, 55, 60],
    rancho: [40, 70, 30, 15, 20, 70],
    munna: [50, 30, 80, 35, 45, 20],
    circuit: [30, 25, 70, 25, 60, 20],
    pushpa: [60, 50, 40, 45, 75, 30],
    farhan: [45, 55, 50, 25, 45, 40],
};

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

function buildUserVector(needs, wants, savings, granular) {
    const dining = granular?.dining || 0;
    const travel = granular?.travel || 0;
    const shopping = granular?.shopping || 0;
    const entertainment = granular?.entertainment || 0;
    const invest = granular?.invest || savings;

    return [
        Math.min(100, Math.max(0, (wants * 1.5) + (travel * 0.8) - (savings * 0.8) + 25)),
        Math.min(100, Math.max(0, (savings * 1.8) - (wants * 0.5) + 20)),
        Math.min(100, Math.max(0, (dining * 2) + (entertainment * 1.5) + (travel * 0.5) + 15)),
        Math.min(100, Math.max(0, (shopping * 2.5) + (wants * 0.3) + 15)),
        Math.min(100, Math.max(0, (needs * 1.2) - (savings * 0.4) + 15)),
        Math.min(100, Math.max(0, (savings * 1.8) + (invest * 0.5)))
    ];
}

// V5: TUNED OVERRIDES - adjusted thresholds for more balanced output
function determinePersona(needs, wants, savings, granular) {
    const dining = granular?.dining || 0;
    const travel = granular?.travel || 0;
    const shopping = granular?.shopping || 0;
    const entertainment = granular?.entertainment || 0;

    // SHOPPING QUEEN
    if (shopping >= 28 && wants > 35) return 'poo';

    // SOCIAL SPENDER
    if ((dining >= 20 || entertainment >= 15) && dining + entertainment >= 30) return 'munna';

    // EXTREME SAVER (tightened threshold)
    if (savings >= 45 && wants < 12 && needs < 45) return 'baburao';

    // TRAVEL BUG
    if (travel >= 22 && wants > 28) return 'bunny';

    // SCHEME CHASER
    if (wants >= 45 && savings < 12) return 'raju';

    // HIGH ANXIETY HUSTLER (tightened)
    if (needs >= 75 && savings > 12) return 'pushpa';

    // HIGH RISK GAMBLER
    if (wants >= 35 && entertainment >= 18 && savings < 20) return 'veeru';

    // IMPULSIVE GEET (low savings, moderate spending)
    if (wants >= 30 && savings < 20 && travel < 15 && shopping < 20) return 'geet';

    // GENEROUS RAJ (high social with decent savings)
    if (dining >= 15 && travel >= 10 && savings >= 20 && wants > 25) return 'raj';

    // PASSIVE FOLLOWER
    if (needs >= 55 && wants < 25 && savings < 25) return 'circuit';

    // PASSION CHASER FARHAN
    if (entertainment >= 12 && travel >= 12 && savings > 15 && savings < 35) return 'farhan';

    // STATUS FLEXER
    if (shopping >= 18 && wants >= 25 && savings >= 20) return 'chatur';

    // DEFAULT: Use vector matching
    const userVector = buildUserVector(needs, wants, savings, granular);
    const scores = {};
    for (const [charKey, charVector] of Object.entries(CHARACTER_VECTORS)) {
        scores[charKey] = cosineSimilarity(userVector, charVector);
    }
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
}

// SIMULATION
const PERSONAS = Object.keys(CHARACTER_VECTORS);
const SAMPLE_SIZE = 10000;

console.log("=".repeat(60));
console.log("MONTE CARLO TEST: HYBRID V5 (Fine-tuned)");
console.log(`Sample Size: ${SAMPLE_SIZE}`);
console.log("=".repeat(60));

const results = {};
PERSONAS.forEach(p => results[p] = 0);

for (let i = 0; i < SAMPLE_SIZE; i++) {
    const needs = Math.floor(Math.random() * 60) + 20;
    const remaining = 100 - needs;
    const wants = Math.floor(Math.random() * remaining);
    const savings = remaining - wants;

    const granular = {
        dining: Math.floor(Math.random() * Math.min(35, wants)),
        travel: Math.floor(Math.random() * Math.min(35, wants)),
        shopping: Math.floor(Math.random() * Math.min(35, wants)),
        entertainment: Math.floor(Math.random() * Math.min(25, wants)),
        invest: savings
    };

    const persona = determinePersona(needs, wants, savings, granular);
    results[persona]++;
}

console.log("\nCHARACTER DISTRIBUTION:");
console.log("-".repeat(60));

const sortedResults = Object.entries(results)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
        key,
        count,
        percentage: ((count / SAMPLE_SIZE) * 100).toFixed(2)
    }));

sortedResults.forEach(({ key, percentage }) => {
    const bar = "█".repeat(Math.floor(percentage * 2));
    const status = percentage > 10 ? "⚠️ HIGH" : percentage < 3 ? "⚠️ LOW" : "✅ OK";
    console.log(`${key.padEnd(10)} ${percentage.padStart(6)}% ${bar} ${status}`);
});

const percentages = sortedResults.map(r => parseFloat(r.percentage));
const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
const variance = percentages.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / percentages.length;
const stdDev = Math.sqrt(variance);

console.log("\n" + "-".repeat(60));
console.log(`Target: ${(100 / PERSONAS.length).toFixed(2)}% each`);
console.log(`Std Dev: ${stdDev.toFixed(2)} (target <3)`);
console.log(`Spread: ${Math.min(...percentages).toFixed(2)}% - ${Math.max(...percentages).toFixed(2)}%`);

const low = sortedResults.filter(r => parseFloat(r.percentage) < 3);
if (low.length > 0) {
    console.log(`⚠️ LOW (<3%): ${low.map(m => m.key).join(', ')}`);
}
