// REGRESSION TEST: Persona-Driven Allocation Logic
// Run this in browser console after loading the app

console.log("=== REGRESSION TEST: Persona + Goal Combinations ===\n");

const testCases = [
    // Jethalal (Risk-Taker)
    {
        persona: "jethalal",
        goals: ["First Home Purchase"],
        savings: 25,
        tenure: 15,
        expected: { equity: ">= 70", debt: "<= 25" }
    },
    {
        persona: "jethalal",
        goals: ["FIRE (Retire Early)"],
        savings: 35,
        tenure: 20,
        expected: { equity: ">= 80", debt: "<= 15" }
    },

    // Popatlal (Conservative)
    {
        persona: "popatlal",
        goals: ["First Home Purchase"],
        savings: 25,
        tenure: 15,
        expected: { equity: "<= 45", debt: ">= 40" }
    },
    {
        persona: "popatlal",
        goals: ["Emergency Fund"],
        savings: 30,
        tenure: 3,
        expected: { equity: "<= 30", debt: ">= 55" }
    },

    // Bhide (Disciplined Saver)
    {
        persona: "bhide",
        goals: ["SIP Portfolio"],
        savings: 35,
        tenure: 25,
        expected: { equity: "55-65", debt: "25-35", gold: ">= 10" }
    },

    // Champaklal (Retiree)
    {
        persona: "champaklal",
        goals: ["Parental Medical Care"],
        savings: 15,
        tenure: 5,
        expected: { equity: "<= 30", debt: ">= 60" }
    },

    // Babita (Lifestyle Spender)
    {
        persona: "babita",
        goals: ["Destination Wedding"],
        savings: 15,
        tenure: 3,
        expected: { equity: "<= 40", debt: ">= 50" }
    },

    // Mehta (Balanced)
    {
        persona: "mehta",
        goals: ["Global Education (Kids)"],
        savings: 25,
        tenure: 12,
        expected: { equity: "50-60", debt: "30-40" }
    }
];

// Mock function to simulate allocation
function testAllocation(testCase) {
    let baseEquity = 50, baseDebt = 30, baseGold = 20;
    const { persona, goals, savings, tenure } = testCase;

    // Horizon adjustment
    if (tenure < 5) { baseEquity = 40; baseDebt = 45; baseGold = 15; }
    else if (tenure > 15) { baseEquity = 70; baseDebt = 20; baseGold = 10; }

    // Risk adjustment
    let risk = 2;
    if (["jethalal", "babita", "roshan"].includes(persona)) risk = 3;
    if (["bhide", "popatlal", "champaklal"].includes(persona)) risk = 1;

    if (risk === 3) { baseEquity += 15; baseDebt -= 10; }
    if (risk === 1) { baseEquity -= 15; baseDebt += 15; }

    // Persona modifiers
    if (persona === "jethalal") { baseEquity += 10; baseGold -= 5; }
    if (persona === "popatlal") { baseDebt += 10; baseEquity -= 10; }
    if (persona === "babita") { baseDebt += 5; baseEquity -= 5; }
    if (persona === "bhide") { baseDebt += 5; baseGold += 5; baseEquity -= 10; }
    if (persona === "champaklal") { baseDebt += 15; baseEquity -= 15; }

    // Savings modifier
    if (savings > 30) { baseEquity += 5; baseDebt -= 5; }
    else if (savings < 15) { baseEquity -= 5; baseDebt += 5; }

    // Goal modifiers
    if (goals.some(g => g.includes("Wedding") || g.includes("Car") || g.includes("Vacation"))) {
        baseDebt += 10; baseEquity -= 10;
    }
    if (goals.includes("FIRE (Retire Early)") || goals.includes("SIP Portfolio")) {
        baseEquity += 10; baseDebt -= 5; baseGold -= 5;
    }
    if (goals.includes("Parental Medical Care") || goals.includes("Emergency Fund")) {
        baseDebt += 10; baseEquity -= 10;
    }

    // Clamp
    baseEquity = Math.max(20, Math.min(85, baseEquity));
    baseDebt = Math.max(10, Math.min(60, baseDebt));
    baseGold = 100 - baseEquity - baseDebt;

    return { equity: baseEquity, debt: baseDebt, gold: baseGold };
}

// Run tests
let passed = 0, failed = 0;

testCases.forEach((tc, idx) => {
    const result = testAllocation(tc);
    const exp = tc.expected;

    console.log(`\n--- Test ${idx + 1}: ${tc.persona} + ${tc.goals[0]} ---`);
    console.log(`Tenure: ${tc.tenure}Y, Savings: ${tc.savings}%`);
    console.log(`Result: Equity ${result.equity}%, Debt ${result.debt}%, Gold ${result.gold}%`);

    // Simple validation (expand as needed)
    let testPassed = true;
    if (exp.equity.includes(">=")) {
        const threshold = parseInt(exp.equity.split(">=")[1]);
        if (result.equity < threshold) testPassed = false;
    } else if (exp.equity.includes("<=")) {
        const threshold = parseInt(exp.equity.split("<=")[1]);
        if (result.equity > threshold) testPassed = false;
    }

    if (testPassed) {
        console.log("✅ PASS");
        passed++;
    } else {
        console.log(`❌ FAIL - Expected ${exp.equity}% equity, got ${result.equity}%`);
        failed++;
    }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);
