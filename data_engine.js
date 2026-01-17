

const DATA_ENGINE_CORE = {
    // ===================================
    // 1. INPUT DEFINITIONS (V4 UPGRADE)
    // ===================================
    MCC_CATEGORIES: {
        "groceries": { name: "Groceries (Zepto/JioMart)", code: "5411", type: "needs" },
        "utilities": { name: "Utilities (Bills/Rent)", code: "4900", type: "needs" },
        "rent": { name: "Rent/EMI (Housing)", code: "6513", type: "needs" },
        "health": { name: "Health & Meds", code: "8043", type: "needs" },
        "dining": { name: "Dining & Food Apps", code: "5814", type: "wants" },
        "travel": { name: "Travel (Uber/Flights)", code: "4121", type: "wants" },
        "shopping": { name: "Shopping (Amazon/Myntra)", code: "5311", type: "wants" },
        "entertainment": { name: "Movies & OTT", code: "7832", type: "wants" },
        "savings": { name: "Investments (SIPs/FDs)", code: "9999", type: "savings" }
    },

    GOALS_BY_AGE: {
        "18-25": ["FG001", "FG002", "FG013", "FG015", "FG032", "FG006", "FG016", "FG023"],
        "26-42": ["FG005", "FG011", "FG029", "FG006", "FG008", "FG027", "FG026", "FG030", "FG010"],
        "43-58": ["FG016", "FG011", "FG029", "FG020", "FG033", "FG013", "FG026", "FG034"],
        "18-22": ["FG001", "FG002", "FG013", "FG015", "FG032", "FG006"], // Alias for compatibility
        "22-28": ["FG001", "FG006", "FG016", "FG005", "FG015", "FG030"],
        "29-39": ["FG005", "FG029", "FG011", "FG010", "FG006", "FG027"],
        "40-60": ["FG016", "FG011", "FG033", "FG026", "FG034", "FG008"],
        "60+": ["FG011", "FG020", "FG033", "FG034", "FG026"]
    },

    ALL_GOALS: {
        "FG001": { id: "FG001", label: "Emergency Fund", years: 1, corpus: 6, category: "Essential", horizon: "Short", cost: "₹3-12L", priority: "Critical", primer: "Buffer for job loss or medical crises.", tax_efficiency: "Liquid Funds (Taxed at slab)." },
        "FG002": { id: "FG002", label: "Health Insurance", years: 1, corpus: 0.25, category: "Essential", horizon: "Short", cost: "₹20-60k/yr", priority: "Critical", primer: "Cover hospital bills without breaking FDs.", tax_efficiency: "Section 80D deduction available." },
        "FG003": { id: "FG003", label: "Term Life Insurance", category: "Essential", horizon: "Long", cost: "₹5-15k/yr", priority: "Critical", primer: "Income replacement for dependents.", tax_efficiency: "Section 80C deduction available." },
        "FG004": { id: "FG004", label: "Student Loan Repayment", category: "Essential", horizon: "Medium", cost: "₹4-10L", priority: "High", primer: "Clear debt to boost credit score.", tax_efficiency: "Section 80E interest deduction." },
        "FG005": { id: "FG005", label: "First Home Purchase", category: "Wealth", horizon: "Medium", cost: "₹50-300L", priority: "High", primer: "Down payment + Registration costs.", tax_efficiency: "Section 80C (Principal) + 24b (Interest)." },
        "FG006": { id: "FG006", label: "FIRE (Retire Early)", years: 20, corpus: 300, category: "Lifestyle", horizon: "Long", cost: "₹3.75-5Cr", priority: "High", primer: "Freedom from 9-to-5 loop.", tax_efficiency: "LTCG on Equity < 1.25L is tax free." },
        "FG007": { id: "FG007", label: "Destination Wedding", category: "Lifestyle", horizon: "Short-Medium", cost: "₹12-70L", priority: "Medium", primer: "The 'Big Fat Indian Wedding' experience.", tax_efficiency: "Short term gains taxed at slab." },
        "FG008": { id: "FG008", label: "Second Home (Hills)", category: "Lifestyle", horizon: "Medium-Long", cost: "₹50-300L", priority: "Medium", primer: "Vacation home or rental income.", tax_efficiency: "Rental income taxable." },
        "FG009": { id: "FG009", label: "Global Education (Kids)", category: "Lifestyle", horizon: "Long", cost: "₹80-200L", priority: "High", primer: "Dollar-denominated corpus required.", tax_efficiency: "LRS limit: $250k/yr." },
        "FG010": { id: "FG010", label: "Angel Investing", category: "Wealth", horizon: "Long", cost: "₹25-100L", priority: "Medium", primer: "High risk, high reward bets.", tax_efficiency: "Unlisted shares: LTCG @ 20% with indexation." },
        "FG011": { id: "FG011", label: "Parental Medical Care", category: "Essential", horizon: "Medium-Long", cost: "₹20-50L", priority: "Critical", primer: "Corpus for geriatric care.", tax_efficiency: "Medical exp deductible for seniors." },
        "FG012": { id: "FG012", label: "Home Renovation", category: "Lifestyle", horizon: "Short-Medium", cost: "₹15-60L", priority: "Medium", primer: "Upgrading lifestyle.", tax_efficiency: "No specific tax breaks." },
        "FG013": { id: "FG013", label: "Sabbatical (Break)", years: 2, corpus: 4, category: "Lifestyle", horizon: "Short", cost: "₹2-5L", priority: "Medium", primer: "6-month expense coverage.", tax_efficiency: "Use Liquid Funds." },
        "FG014": { id: "FG014", label: "Luxury Car", category: "Lifestyle", horizon: "Short-Medium", cost: "₹50-150L", priority: "Low", primer: "Status symbol purchase.", tax_efficiency: "Depreciating asset. No tax save." },
        "FG015": { id: "FG015", label: "Intl Family Vacation", years: 3, corpus: 5, category: "Lifestyle", horizon: "Short", cost: "₹3-8L", priority: "Medium", primer: "Annual trip abroad.", tax_efficiency: "TCS applies on forex > 7L." },
        "FG016": { id: "FG016", label: "SIP Portfolio", category: "Wealth", horizon: "Long", cost: "SIP ₹50k+", priority: "Critical", primer: "Disciplined wealth creation.", tax_efficiency: "Equity taxation rules apply." },
        "FG017": { id: "FG017", label: "Stock Market (Direct)", category: "Wealth", horizon: "Long", cost: "₹1-50L", priority: "High", primer: "Direct equity exposure.", tax_efficiency: "STCG 20%, LTCG 12.5%." },
        "FG018": { id: "FG018", label: "REIT Portfolio", category: "Wealth", horizon: "Medium-Long", cost: "₹1-50L", priority: "Medium", primer: "Real estate without the hassle.", tax_efficiency: "Dividend/Interest taxation varies." },
        "FG019": { id: "FG019", label: "P2P Lending", category: "Wealth", horizon: "Short-Medium", cost: "₹1-10L", priority: "Medium", primer: "Alternative high-yield debt.", tax_efficiency: "Interest taxed at slab." },
        "FG020": { id: "FG020", label: "FD Ladder", category: "Wealth", horizon: "Short-Long", cost: "₹1-50L", priority: "Medium", primer: "Safety first approach.", tax_efficiency: "Interest fully taxable." },
        "FG021": { id: "FG021", label: "Tax Saving (PPF/NPS)", category: "Wealth", horizon: "Long", cost: "₹1.5-15L/yr", priority: "Critical", primer: "Section 80C optimization.", tax_efficiency: "PPF is EEE (Tax Free)." },
        "FG022": { id: "FG022", label: "Startup Funding (Own)", category: "Wealth", horizon: "Medium-Long", cost: "₹50-200L", priority: "Low", primer: "Seed capital for your venture.", tax_efficiency: "Business expense deductions." },
        "FG023": { id: "FG023", label: "Digital Business Setup", category: "Wealth", horizon: "Short-Medium", cost: "₹1-20L", priority: "Medium", primer: "Side hustle infrastructure.", tax_efficiency: "GST input credit available." },
        "FG026": { id: "FG026", label: "Dividend Portfolio", category: "Wealth", horizon: "Long", cost: "₹10-50L", priority: "High", primer: "Passive income from stocks.", tax_efficiency: "Dividends taxed at slab." },
        "FG027": { id: "FG027", label: "Freelance Side Hustle", category: "Wealth", horizon: "Short-Medium", cost: "Time/Skill", priority: "Medium", primer: "Monetizing skills.", tax_efficiency: "Presumptive taxation (44ADA)." },
        "FG029": { id: "FG029", label: "Child Education (India)", category: "Essential", horizon: "Medium-Long", cost: "₹20-60L", priority: "High", primer: "Higher ed costs are inflating @ 10%.", tax_efficiency: "Sukanya Samriddhi for girl child." },
        "FG030": { id: "FG030", label: "Wedding Fund", category: "Lifestyle", horizon: "Short-Medium", cost: "₹15-50L", priority: "Medium", primer: "Social obligation fund.", tax_efficiency: "Gold gifting rules apply." },
        "FG032": { id: "FG032", label: "Skill Upgrade (MBA/CFA)", years: 3, corpus: 10, category: "Wealth", horizon: "Short", cost: "₹1-10L", priority: "High", primer: "Investing in yourself.", tax_efficiency: "Education loan interest deduction." },
        "FG033": { id: "FG033", label: "Legacy Planning", category: "Essential", horizon: "Long", cost: "Variable", priority: "Medium", primer: "Passing wealth to next gen.", tax_efficiency: "No inheritance tax in India." },
        "FG034": { id: "FG034", label: "Charity Fund", category: "Lifestyle", horizon: "Long", cost: "1-5% Income", priority: "Medium", primer: "Giving back to society.", tax_efficiency: "Section 80G deduction." }
    },

    // ===================================
    // 2. LOGIC CORE (NISM COMPLIANT)
    // ===================================
    // ===================================
    // 2. LOGIC CORE (TAX RULES 2024-25)
    // ===================================
    TAX_RULES_2024: {
        "equity": {
            short_term: "20% (if < 1yr)",
            long_term: "12.5% (if > 1yr)",
            exemption: "LTCG upto ₹1.25L is Tax Free"
        },
        "debt": {
            short_term: "Slab Rate (if bought > Apr '23)",
            long_term: "Slab Rate (No Indexation benefit)"
        },
        "gold": {
            short_term: "Slab Rate (if < 24 months)",
            long_term: "12.5% (if > 24 months)"
        },
        "hybrid_equity": { // > 65% Equity
            short_term: "20% (if < 1yr)",
            long_term: "12.5% (if > 1yr)"
        },
        "hybrid_debt": { // < 35% Equity
            short_term: "Slab Rate",
            long_term: "Slab Rate"
        }
    },

    NISM_RULES: {
        "young_earner": {
            range: [18, 28],
            min_equity: 70,
            target_equity: 75,
            advice: {
                title: "Beat Inflation (Early)",
                category: "Index Funds (Nifty 50)",
                metric: "Target: >12% CAGR",
                reason: "You are young. Being safe = Losing money to inflation."
            }
        },
        "mid_career": {
            range: [29, 45],
            min_equity: 50,
            target_equity: 60,
            advice: {
                title: "Growth + Safety Balance",
                category: "Flexi-Cap Funds",
                metric: "Target: 10-12% CAGR",
                reason: "Balance family goals with long-term wealth."
            }
        },
        "pre_retirement": {
            range: [46, 100],
            max_equity: 45,
            target_equity: 40,
            advice: {
                title: "Capital Protection",
                category: "Debt Mutual Funds / NPS",
                metric: "Protect Capital",
                reason: "You cannot afford a crash. Shift to Debt."
            }
        }
    },

    // ===================================
    // 3. THE 16 TMKOC PERSONAS (UNCHANGED)
    // ===================================
    PERSONAS: {
        "jethalal": {
            name: "Jethalal Gada",
            role: "The Optimistic Businessman",
            traits: ["Cash Rich", "Asset Poor", "High Risk"],
            ruler: "Mars (Power)",
            quote: "Tapu ke papa, business badhana hai!",
            color: "#FF5733",
            img: "assets/jethalal.png"
        },
        "bhide": {
            name: "Aatmaram Bhide",
            role: "The Disciplined Teacher",
            traits: ["Saver", "Risk Averse", "FD Lover"],
            ruler: "Jupiter (Wisdom)",
            quote: "Hamare zamane mein savings karte thay!",
            color: "#FFC300",
            img: "assets/bhide.png"
        },
        "popatlal": {
            name: "Popatlal",
            role: "The Anxious Hoarder",
            traits: ["Fearful", "Cash Hoarder", "Zero Growth"],
            ruler: "Saturn (Delay)",
            quote: "Duniya hil jayegi, par mera paisa nahi hilega!",
            color: "#C70039",
            img: "assets/popatlal.png"
        },
        "babita": {
            name: "Babita Ji",
            role: "The Luxury Icon",
            traits: ["High Spender", "Aesthetics", "Impulse"],
            ruler: "Venus (Beauty)",
            quote: "Ye dress discount mein mila!",
            color: "#DAF7A6",
            img: "assets/babita.png"
        },
        "iyer": {
            name: "Krishnan Iyer",
            role: "The Tech Investor",
            traits: ["Data Driven", "Crypto/Tech", "Systematic"],
            ruler: "Mercury (Intellect)",
            quote: "Rocket science logic lagaya hai maine.",
            color: "#33FFBD",
            img: "assets/iyer.png"
        },
        "sodhi": {
            name: "Roshan Singh Sodhi",
            role: "The Asset Builder",
            traits: ["Real Estate", "Optimist", "High Growth"],
            ruler: "Mars (Land)",
            quote: "Property ke daam kabhi neeche nahi jaate!",
            color: "#FF9800",
            img: "assets/sodhi.png"
        },
        "daya": {
            name: "Daya Bhabhi",
            role: "The Family Spender",
            traits: ["Generous", "Travel Lover", "Charity"],
            ruler: "Jupiter + Venus",
            quote: "Hey Maa Mataji! Sabka bhala karo.",
            color: "#E91E63",
            img: "assets/daya.png"
        },
        "tapu": {
            name: "Tapu",
            role: "The Gen-Z Gambler",
            traits: ["Speculative", "Zero Savings", "FOMO"],
            ruler: "Rahu (Chaos)",
            quote: "Crypto is the future, Dadaji!",
            color: "#900C3F",
            img: "assets/tapu.png"
        },
        "anjali": {
            name: "Anjali Mehta",
            role: "The Health & Insurance Freak",
            traits: ["Protection", "Conservative", "Health First"],
            ruler: "Moon (Care)",
            quote: "Paisa aur Sehat, dono control mein chahiye.",
            color: "#2ECC71",
            img: "assets/anjali.png"
        },
        "mehta": {
            name: "Taarak Mehta",
            role: "The Advisor (Analysis Paralysis)",
            traits: ["Overthinking", "Balanced", "Slow Action"],
            ruler: "Mercury (Writer)",
            quote: "Har pehlu ko sochna padta hai Jethalal.",
            color: "#5DADE2",
            img: "assets/mehta.png"
        },
        "komal": {
            name: "Komal Hathi",
            role: "The Comfort Seeker",
            traits: ["Foodie", "Comfort First", "Instant Joy"],
            ruler: "Jupiter (Abundance)",
            quote: "Oh c'mon Hans! Thoda khaane do.",
            color: "#9C27B0",
            img: "assets/komal.png"
        },
        "madhavi": {
            name: "Madhavi Bhide",
            role: "The Efficient Side-Hustler",
            traits: ["Entrepreneurial", "Saver", "Balanced"],
            ruler: "Venus (Business)",
            quote: "Achaar papad se bhi empire banta hai.",
            color: "#F4D03F",
            img: "assets/madhavi.png"
        },
        "champaklal": {
            name: "Champak Chacha",
            role: "The Debt Avenger",
            traits: ["Debt Hater", "Traditional", "No Credit"],
            ruler: "Sun (Authority)",
            quote: "Udhaar maangna paap hai!",
            color: "#D35400",
            img: "assets/champaklal.png"
        },
        "natukaka": {
            name: "Natu Kaka",
            role: "The Pension Seeker",
            traits: ["Loyal", "Safety First", "Low Income"],
            ruler: "Ketu (Routine)",
            quote: "Pagar kab badhegi sethji?",
            color: "#7F8C8D",
            img: "assets/natukaka.png"
        },
        "bagha": {
            name: "Bagha",
            role: "The Experimental Follower",
            traits: ["Random", "Gullible", "Weird Bets"],
            ruler: "Rahu (Confusion)",
            quote: "Jaisi jiski soch!",
            color: "#8E44AD",
            img: "assets/bagha.png"
        },
        "roshan": {
            name: "Mrs. Roshan",
            role: "The Emotional Spender",
            traits: ["Social", "Heart-driven", "Generous"],
            ruler: "Venus (Love)",
            quote: "Oh ji, party karte hai!",
            color: "#F1948A",
            img: "assets/roshan.png"
        },
        "abdul": {
            name: "Abdul",
            role: "The Gig Survivor",
            traits: ["Cash Flow Focus", "Survival", "No Assets"],
            ruler: "Saturn (Service)",
            quote: "Sabka kaam karta hoon, par apna account khali hai.",
            color: "#2C3E50",
            img: "assets/abdul.png"
        }
    },

    // ==========================================================
    // 4. ASTRO TRANSLATOR (UNCHANGED)
    // ==========================================================
    ASTRO_TRANSLATIONS: {
        "Saturn": "Saturn (Shani) restricts. It creates fear of poverty, making you hoard cash or fear growth.",
        "Jupiter": "Jupiter (Guru) expands. It wants you to grow wealth, but sometimes makes you lazy with 'safe' options.",
        "Mars": "Mars (Mangal) is aggressive. It drives business risk but can lead to impulsive decisions.",
        "Rahu": "Rahu is the illusionist. It creates anxiety about the future, leading to irrational hoarding.",
        "Mercury": "Mercury (Budh) is intellect. It loves calculation, spreadsheets, and diversified portfolios.",
        "Venus": "Venus (Shukra) loves luxury. It makes you spend on 'Good Life' assets rather than boring funds.",
        "Moon": "Moon (Chandra) is emotion. It makes your spending fluctuate with your mood.",
        "Sun": "The Sun (Surya) is ego. It makes you want 'Status' investments like Real Estate.",
        "Uranus": "Uranus breaks rules. You hate traditional FDs and want Crypto or new-age tech.",
        "Neptune": "Neptune is undefined. You follow the herd because you don't have a clear plan.",
        "Pluto": "Pluto is about control and secrets. You trust only what you can see and hold (Cash/Gold)."
    },

    // ==========================================================
    // 5. REFERENCE DATA (STATES)
    // ==========================================================
    ALL_STATES: [
        "andaman-&-nicobar-islands", "andhra-pradesh", "arunachal-pradesh", "assam", "bihar",
        "chandigarh", "chhattisgarh", "dadra-&-nagar-haveli-&-daman-&-diu", "delhi", "goa",
        "gujarat", "haryana", "himachal-pradesh", "jammu-&-kashmir", "jharkhand", "karnataka",
        "kerala", "ladakh", "lakshadweep", "madhya-pradesh", "maharashtra", "manipur", "meghalaya",
        "mizoram", "nagaland", "odisha", "puducherry", "punjab", "rajasthan", "sikkim", "tamil-nadu",
        "telangana", "tripura", "uttar-pradesh", "uttarakhand", "west-bengal"
    ],

    // COST OF LIVING MULTIPLIERS (Source: Numbeo + BhulekhIndia 2025)
    // Weighted Index: Rent 30%, Food 25%, Transport 20%, Healthcare/Education 15%, Utilities 10%
    // Baseline: National Average = 1.0
    STATE_MULTIPLIERS: {
        "andhra-pradesh": 1.05,
        "arunachal-pradesh": 0.95,
        "assam": 0.95,
        "bihar": 0.75,
        "chhattisgarh": 0.8,
        "goa": 1.3,
        "gujarat": 1.05,
        "haryana": 1.15,
        "himachal-pradesh": 1.0,
        "jharkhand": 0.85,
        "karnataka": 1.35,
        "kerala": 1.05,
        "madhya-pradesh": 0.85,
        "maharashtra": 1.4,
        "manipur": 0.9,
        "meghalaya": 0.95,
        "mizoram": 0.9,
        "nagaland": 0.9,
        "odisha": 0.8,
        "punjab": 1.05,
        "rajasthan": 0.95,
        "sikkim": 1.1,
        "tamil-nadu": 1.05,
        "telangana": 1.2,
        "tripura": 0.85,
        "uttar-pradesh": 0.85,
        "uttarakhand": 1.0,
        "west-bengal": 1.0,
        "andaman-and-nicobar-islands": 1.25,
        "chandigarh": 1.25,
        "dadra-and-nagar-haveli-and-daman-and-diu": 0.95,
        "delhi": 1.35,
        "jammu-and-kashmir": 1.1,
        "ladakh": 1.2,
        "lakshadweep": 1.15,
        "puducherry": 1.05
    },

    // GAP ANALYSIS MAPPING (FALLBACK)
    CATEGORY_ADVICE: {
        "inflation_protection": {
            title: "Beat Inflation",
            category: "Multi-Asset Allocation Fund",
            metric: "Look for: >12% Rolling Returns (3Y)",
            reason: "Your idle cash is losing value.",
            example_funds: ["ICICI Pru Multi-Asset", "Quant Multi-Asset"] // Hardcoded "Best of" subset
        },
        "wealth_creation": {
            title: "Create Wealth",
            category: "Flexi-Cap / Index Fund",
            metric: "Look for: Expense Ratio < 0.5%",
            reason: "You have a high surplus. Put it to work.",
            example_funds: ["Nifty 50 Index", "Parag Parikh Flexi Cap"]
        },
        "safety_net": {
            title: "Build Safety Net",
            category: "Liquid Fund",
            metric: "Look for: Instant Redemption",
            reason: "You are vulnerable to shocks. Build a buffer.",
            example_funds: ["Quantum Liquid", "Parag Parikh Liquid"]
        },
        "debt_killing": {
            title: "Kill Bad Debt",
            category: "Debt Repayment Strategy",
            metric: "Focus: High Interest Loans First",
            reason: "Interest > Returns. Pay off credit cards.",
            example_funds: []
        },
        "gold_hedge": {
            title: "Hedge with Gold",
            category: "Sovereign Gold Bond (SGB)",
            metric: "Look for: 2.5% Extra Interest",
            reason: "You love tangible assets. Do it digitally.",
            example_funds: ["RBI SGB Series"]
        }
    },

    // ===================================
    // 6. ALLOCATION LOGIC MATRIX (NEW)
    // ===================================
    GOAL_ALLOCATION_MATRIX: {
        "SHORT-CONSERVATIVE": {
            liquid: [35, 40], fixedDeposit: [45, 55], gold: [5, 10], equity: [0, 5],
            expectedReturn: "5.5-7%", rebalanceFreq: "semi-annual",
            funds: ["Liquid Funds", "Overnight Funds", "Bank FDs"]
        },
        "SHORT-MODERATE": {
            liquid: [20, 30], fixedDeposit: [40, 50], gold: [10, 15], equity: [10, 15],
            expectedReturn: "7-8.5%", rebalanceFreq: "quarterly",
            funds: ["Arbitrage Funds", "Short Duration Debt", "Hybrid Conservative"]
        },
        "SHORT-AGGRESSIVE": { // Rule 3 (High Risk)
            liquid: [10, 20], fixedDeposit: [10, 20], gold: [5, 10], equity: [55, 70],
            expectedReturn: "10-12%", rebalanceFreq: "monthly",
            funds: ["Balanced Advantage", "Flexi Cap", "Large Cap"]
        },
        "MEDIUM-CONSERVATIVE": {
            liquid: [10, 20], fixedDeposit: [30, 40], gold: [10, 15], equity: [30, 40],
            expectedReturn: "8-9.5%", rebalanceFreq: "quarterly",
            funds: ["Hybrid Conservative", "Corporate Bond Funds"]
        },
        "MEDIUM-MODERATE": { // FIRE Prep
            liquid: [5, 10], fixedDeposit: [15, 25], gold: [5, 10], equity: [55, 70],
            expectedReturn: "10-11%", rebalanceFreq: "quarterly",
            funds: ["Nifty 50 Index", "Aggressive Hybrid", "SGB"]
        },
        "MEDIUM-AGGRESSIVE": {
            liquid: [0, 5], fixedDeposit: [10, 15], gold: [5, 10], equity: [65, 85],
            expectedReturn: "12-14%", rebalanceFreq: "monthly",
            funds: ["Mid Cap Funds", "Active Small Cap", "Momentum Strategy"]
        },
        "LONG-CONSERVATIVE": {
            liquid: [5, 10], fixedDeposit: [30, 40], gold: [10, 15], equity: [40, 50],
            expectedReturn: "9-10%", rebalanceFreq: "semi-annual",
            funds: ["Balanced Advantage", "Large Cap Index"]
        },
        "LONG-MODERATE": {
            liquid: [5, 5], fixedDeposit: [10, 20], gold: [5, 10], equity: [65, 85],
            expectedReturn: "11-12%", rebalanceFreq: "quarterly",
            funds: ["Flexi Cap", "Nifty Next 50", "PPF/NPS"]
        },
        "LONG-AGGRESSIVE": { // Gen Z Wealth
            liquid: [0, 5], fixedDeposit: [0, 10], gold: [0, 5], equity: [75, 95],
            expectedReturn: "13-15%", rebalanceFreq: "quarterly",
            funds: ["Small Cap Funds", "Mid Cap Funds", "Sectoral Bets"]
        }
    }
};



// EXPORT Logic (Browser + Node.js)
if (typeof window !== 'undefined') {
    window.DATA_ENGINE = DATA_ENGINE_CORE;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DATA_ENGINE_CORE;
}
