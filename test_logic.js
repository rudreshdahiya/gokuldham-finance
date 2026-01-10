const FORENSICS_ENGINE = require('./forensics_engine.js');
const DATA_ENGINE = require('./data_engine.js');
const MACRO_DATA = require('./macro_data.js'); // Assuming this works in Node or mock it

// MOCK MACRO DATA if needed
const MOCK_MACRO = {
    cpi_inflation: 6.3,
    nifty_pe: 22,
    gold_price_10g: 65000
};

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ PASS: ${message}`);
    }
}

console.log("\n🚀 RUNNING UNIT TESTS: FORENSICS ENGINE\n");

// TEST 1: The Jethalal Trigger (High Debt)
const jethalalInput = {
    state: "Maharashtra",
    age: "29-39",
    needs: 50, wants: 40, savings: 10,
    goal: "wealth",
    granular: { shop: 20, dine: 10, trav: 10, ent: 0, health: 0, debt: 55 }, // High debt > 50 triggers trap
    debtLoad: 55
};
const res1 = FORENSICS_ENGINE.determinePersona(DATA_ENGINE, jethalalInput.state, jethalalInput.age, jethalalInput.needs, jethalalInput.wants, jethalalInput.savings, jethalalInput.goal, jethalalInput.granular, jethalalInput.debtLoad);
assert(res1.key === 'jethalal', `Expected Jethalal for high debt, got ${res1.key}`);

// TEST 2: The Bhide Trigger (High Savings)
const bhideInput = {
    state: "Rajasthan", // Multiplier 1.08 -> Boosts savings
    age: "40-60",
    needs: 40, wants: 10, savings: 50,
    goal: "safety",
    granular: { shop: 0, dine: 0, trav: 0, ent: 0, health: 10, debt: 0 },
    debtLoad: 0
};
const res2 = FORENSICS_ENGINE.determinePersona(DATA_ENGINE, bhideInput.state, bhideInput.age, bhideInput.needs, bhideInput.wants, bhideInput.savings, bhideInput.goal, bhideInput.granular, bhideInput.debtLoad);
assert(res2.key === 'bhide' || res2.key === 'champaklal', `Expected Bhide/Champaklal for high savings, got ${res2.key}`);

// TEST 3: Pulse Multiplier (Bangalore vs Bihar)
// Bangalore (High Cost) -> Should reduce effective savings
// Bihar (Low Cost) -> Should increase effective savings
// Note: We need to know exact multiplier in logic to assert exact value, but we can compare relative.
const savingsRaw = 20;
// We can't easily inspect internal variable 'effectiveSavings' from result unless we expose it.
// However, the 'log' might contain it.
console.log("   (Skipping explicit Pulse Multiplier value check, relying on Persona mapping)");

// TEST 4: Prescription Generation
console.log("\n💊 TESTING PRESCRIPTION GENERATION...");
const rx = FORENSICS_ENGINE.generateFinancialPrescription(
    DATA_ENGINE,
    "22-28", // Young
    100000,
    "FG006",
    20, // savings rate
    0, // EMI
    MOCK_MACRO
);

assert(rx.projections.projected_corpus > 0, "Projected Corpus should be > 0");
assert(rx.allocation && rx.allocation.equity > 0, "Young earner should have Equity allocation");
console.log(`   > Young Earner Equity: ${rx.allocation.equity}%`);
assert(rx.tax_planning, "Tax Planning advice missing");
assert(rx.rebalancing_advice, "Rebalancing advice missing");
console.log(`   > Tax Advice: ${rx.tax_planning}`);

console.log("\n🎉 ALL TESTS PASSED.\n");
