

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
        "FG003": { id: "FG003", label: "Term Life Insurance", years: 1, corpus: 0.15, category: "Essential", horizon: "Long", cost: "₹5-15k/yr", priority: "Critical", primer: "Income replacement for dependents.", tax_efficiency: "Section 80C deduction available." },
        "FG004": { id: "FG004", label: "Student Loan Repayment", years: 5, corpus: 10, category: "Essential", horizon: "Medium", cost: "₹4-10L", priority: "High", primer: "Clear debt to boost credit score.", tax_efficiency: "Section 80E interest deduction." },
        "FG005": { id: "FG005", label: "First Home Purchase", years: 5, corpus: 15, category: "Wealth", horizon: "Medium", cost: "₹50-300L", priority: "High", primer: "Down payment + Registration costs.", tax_efficiency: "Section 80C (Principal) + 24b (Interest)." },
        "FG006": { id: "FG006", label: "FIRE (Retire Early)", years: 20, corpus: 300, category: "Lifestyle", horizon: "Long", cost: "₹3.75-5Cr", priority: "High", primer: "Freedom from 9-to-5 loop.", tax_efficiency: "LTCG on Equity < 1.25L is tax free." },
        "FG007": { id: "FG007", label: "Destination Wedding", years: 5, corpus: 25, category: "Lifestyle", horizon: "Short-Medium", cost: "₹12-70L", priority: "Medium", primer: "The 'Big Fat Indian Wedding' experience.", tax_efficiency: "Short term gains taxed at slab." },
        "FG008": { id: "FG008", label: "Second Home (Hills)", years: 15, corpus: 50, category: "Lifestyle", horizon: "Medium-Long", cost: "₹50-300L", priority: "Medium", primer: "Vacation home or rental income.", tax_efficiency: "Rental income taxable." },
        "FG009": { id: "FG009", label: "Global Education (Kids)", years: 15, corpus: 50, category: "Lifestyle", horizon: "Long", cost: "₹80-200L", priority: "High", primer: "Dollar-denominated corpus required.", tax_efficiency: "LRS limit: $250k/yr." },
        "FG010": { id: "FG010", label: "Angel Investing", years: 5, corpus: 25, category: "Wealth", horizon: "Long", cost: "₹25-100L", priority: "Medium", primer: "High risk, high reward bets.", tax_efficiency: "Unlisted shares: LTCG @ 20% with indexation." },
        "FG011": { id: "FG011", label: "Parental Medical Care", years: 10, corpus: 20, category: "Essential", horizon: "Medium-Long", cost: "₹20-50L", priority: "Critical", primer: "Corpus for geriatric care.", tax_efficiency: "Medical exp deductible for seniors." },
        "FG012": { id: "FG012", label: "Home Renovation", years: 5, corpus: 10, category: "Lifestyle", horizon: "Short-Medium", cost: "₹15-60L", priority: "Medium", primer: "Upgrading lifestyle.", tax_efficiency: "No specific tax breaks." },
        "FG013": { id: "FG013", label: "Sabbatical (Break)", years: 2, corpus: 4, category: "Lifestyle", horizon: "Short", cost: "₹2-5L", priority: "Medium", primer: "6-month expense coverage.", tax_efficiency: "Use Liquid Funds." },
        "FG014": { id: "FG014", label: "Luxury Car", years: 3, corpus: 5, category: "Lifestyle", horizon: "Short-Medium", cost: "₹50-150L", priority: "Low", primer: "Status symbol purchase.", tax_efficiency: "Depreciating asset. No tax save." },
        "FG015": { id: "FG015", label: "Intl Family Vacation", years: 3, corpus: 5, category: "Lifestyle", horizon: "Short", cost: "₹3-8L", priority: "Medium", primer: "Annual trip abroad.", tax_efficiency: "TCS applies on forex > 7L." },
        "FG016": { id: "FG016", label: "SIP Portfolio", years: 10, corpus: 50, category: "Wealth", horizon: "Long", cost: "SIP ₹50k+", priority: "Critical", primer: "Disciplined wealth creation.", tax_efficiency: "Equity taxation rules apply." },
        "FG017": { id: "FG017", label: "Stock Market (Direct)", years: 10, corpus: 20, category: "Wealth", horizon: "Long", cost: "₹1-50L", priority: "High", primer: "Direct equity exposure.", tax_efficiency: "STCG 20%, LTCG 12.5%." },
        "FG018": { id: "FG018", label: "REIT Portfolio", years: 5, corpus: 10, category: "Wealth", horizon: "Medium-Long", cost: "₹1-50L", priority: "Medium", primer: "Real estate without the hassle.", tax_efficiency: "Dividend/Interest taxation varies." },
        "FG019": { id: "FG019", label: "P2P Lending", years: 3, corpus: 5, category: "Wealth", horizon: "Short-Medium", cost: "₹1-10L", priority: "Medium", primer: "Alternative high-yield debt.", tax_efficiency: "Interest taxed at slab." },
        "FG020": { id: "FG020", label: "FD Ladder", years: 5, corpus: 15, category: "Wealth", horizon: "Short-Long", cost: "₹1-50L", priority: "Medium", primer: "Safety first approach.", tax_efficiency: "Interest fully taxable." },
        "FG021": { id: "FG021", label: "Tax Saving (PPF/NPS)", years: 15, corpus: 150, category: "Wealth", horizon: "Long", cost: "₹1.5-15L/yr", priority: "Critical", primer: "Section 80C optimization.", tax_efficiency: "PPF is EEE (Tax Free)." },
        "FG022": { id: "FG022", label: "Startup Funding (Own)", years: 5, corpus: 30, category: "Wealth", horizon: "Medium-Long", cost: "₹50-200L", priority: "Low", primer: "Seed capital for your venture.", tax_efficiency: "Business expense deductions." },
        "FG023": { id: "FG023", label: "Digital Business Setup", years: 2, corpus: 5, category: "Wealth", horizon: "Short-Medium", cost: "₹1-20L", priority: "Medium", primer: "Side hustle infrastructure.", tax_efficiency: "GST input credit available." },
        "FG026": { id: "FG026", label: "Dividend Portfolio", years: 10, corpus: 20, category: "Wealth", horizon: "Long", cost: "₹10-50L", priority: "High", primer: "Passive income from stocks.", tax_efficiency: "Dividends taxed at slab." },
        "FG027": { id: "FG027", label: "Freelance Side Hustle", years: 1, corpus: 2, category: "Wealth", horizon: "Short-Medium", cost: "Time/Skill", priority: "Medium", primer: "Monetizing skills.", tax_efficiency: "Presumptive taxation (44ADA)." },
        "FG029": { id: "FG029", label: "Child Education (India)", years: 15, corpus: 25, category: "Essential", horizon: "Medium-Long", cost: "₹20-60L", priority: "High", primer: "Higher ed costs are inflating @ 10%.", tax_efficiency: "Sukanya Samriddhi for girl child." },
        "FG030": { id: "FG030", label: "Wedding Fund", years: 5, corpus: 20, category: "Lifestyle", horizon: "Short-Medium", cost: "₹15-50L", priority: "Medium", primer: "Social obligation fund.", tax_efficiency: "Gold gifting rules apply." },
        "FG032": { id: "FG032", label: "Skill Upgrade (MBA/CFA)", years: 3, corpus: 10, category: "Wealth", horizon: "Short", cost: "₹1-10L", priority: "High", primer: "Investing in yourself.", tax_efficiency: "Education loan interest deduction." },
        "FG033": { id: "FG033", label: "Legacy Planning", years: 20, corpus: 5, category: "Essential", horizon: "Long", cost: "Variable", priority: "Medium", primer: "Passing wealth to next gen.", tax_efficiency: "No inheritance tax in India." },
        "FG034": { id: "FG034", label: "Charity Fund", years: 10, corpus: 10, category: "Lifestyle", horizon: "Long", cost: "1-5% Income", priority: "Medium", primer: "Giving back to society.", tax_efficiency: "Section 80G deduction." }
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
    // 3. THE 16 BOLLYWOOD PERSONAS (WITH FINANCE STORIES)
    // ===================================
    PERSONAS: {
        "poo": {
            name: "Poo (K3G)",
            role: "The Shopping Queen",
            traits: ["High Spender", "Status Obsessed", "Fashion First"],
            ruler: "Venus (Beauty)",
            quote: "PHAT! Good looks, good looks, and good looks.",
            color: "#FF69B4",
            img: "assets/poo.png",
            finance_story: "Poo treats her credit card like a magic wand. She spends first and thinks never. Every sale is 'essential,' every brand is an 'investment.' She needs a strict 'Wants Budget Cap' before her wardrobe net worth exceeds her actual net worth."
        },
        "bunny": {
            name: "Bunny (YJHD)",
            role: "The Wanderlust Spender",
            traits: ["Travel Addict", "Experience Chaser", "FOMO"],
            ruler: "Jupiter (Expansion)",
            quote: "Main udna chahta hoon... EMI pe!",
            color: "#00CED1",
            img: "assets/bunny.png",
            finance_story: "Bunny's passport has more stamps than his bank has zeros. He funds trips on credit, believing experiences are priceless. True, but so are EMI interest rates! He needs to start a 'Travel Fund SIP' instead of flying on debt."
        },
        "geet": {
            name: "Geet (Jab We Met)",
            role: "The Impulsive Spender",
            traits: ["Spontaneous", "Heart Over Head", "No Planning"],
            ruler: "Moon (Mood)",
            quote: "Main apni favourite hoon - aur mere kharche bhi!",
            color: "#FF6347",
            img: "assets/geet.png",
            finance_story: "Geet doesn't budget, she vibes. Train tickets bought on feelings, shopping done on moods. She needs automated SIPs that deduct salary BEFORE she can impulsively spend it. Her optimism is an asset, but her planning is a liability."
        },
        "raj": {
            name: "Raj (DDLJ)",
            role: "The Rich Lifestyle",
            traits: ["High Income", "Lifestyle Inflation", "Generous"],
            ruler: "Sun (Royalty)",
            quote: "Bade bade deshon mein aisi spending hoti hai.",
            color: "#FFD700",
            img: "assets/raj.png",
            finance_story: "Raj earns in dollars (or behaves like it) and spends like there's no tomorrow. Euro trips, fancy gifts, no concept of 'budget.' His high income masks his low savings rate. He needs to convert cash flow into wealth before the music stops."
        },
        "pushpa": {
            name: "Pushpa (Pushpa)",
            role: "The Self-Made Hustler",
            traits: ["Survivor", "Hard Worker", "Rising Power"],
            ruler: "Mars (Grit)",
            quote: "Jhukega nahi saala, invest karega!",
            color: "#8B4513",
            img: "assets/pushpa.png",
            finance_story: "Pushpa started with nothing and is grinding his way up. He knows the value of every rupee because he earned it hard. But he trusts only cash and power. He needs to trust financial systems (Mutual Funds) to make his money grown without him working."
        },
        "raju": {
            name: "Raju (Hera Pheri)",
            role: "The Schemer",
            traits: ["Get Rich Quick", "High Risk", "Zero Savings"],
            ruler: "Rahu (Illusion)",
            quote: "21 din mein paisa double!",
            color: "#FF4500",
            img: "assets/raju.png",
            finance_story: "Raju dreams of millions but has ₹0 in savings. Every scheme is 'pakka,' every tip is 'insider.' He needs to stop gambling on shortcuts and start a simple, boring SIP. Wealth takes time, Raju bhai!"
        },
        "baburao": {
            name: "Baburao Ganpatrao Apte",
            role: "The Frugal Legend",
            traits: ["Ultra Saver", "Cash Only", "Risk Averse"],
            ruler: "Saturn (Scarcity)",
            quote: "Utha le re baba... mere kharche utha le!",
            color: "#808080",
            img: "assets/baburao.png",
            finance_story: "Baburao counts every paisa. His 'Star Garage' runs on minimal expenses. He is proof that low income + high savings = survival. However, hoarding cash under the mattress loses value to inflation. He needs to trust iconic Debt Funds."
        },
        "shyam": {
            name: "Shyam (Hera Pheri)",
            role: "The Steady Worker",
            traits: ["Honest Income", "Balanced", "Risk Aware"],
            ruler: "Mercury (Reason)",
            quote: "Seedha kaam, seedhi zindagi.",
            color: "#4682B4",
            img: "assets/shyam.png",
            finance_story: "Shyam doesn't dream of schemes, he wants a stable life. Fixed job, fixed salary. He is the ideal candidate for a classic 50-30-20 rule. He just needs to nudge his risk appetite slightly to beat inflation over the long term."
        },
        "chatur": {
            name: "Chatur 'Silencer'",
            role: "The Status Flexer",
            traits: ["NRI Show-Off", "Competitive", "Asset Rich"],
            ruler: "Mars (Status)",
            quote: "Top performance, top tax bracket!",
            color: "#800080",
            img: "assets/chatur.png",
            finance_story: "Chatur's net worth is in his car, watch, and house to impress others. He creates 'Status Wealth' not 'Real Wealth.' He needs to stop competing with others and start compounding for his own freedom."
        },
        "rancho": {
            name: "Rancho",
            role: "The Minimalist Genius",
            traits: ["Anti-Status", "Simple Living", "Wealth Wisdom"],
            ruler: "Jupiter (Knowledge)",
            quote: "Success ke peeche mat bhago, excellence ka peecha karo.",
            color: "#228B22",
            img: "assets/rancho.png",
            finance_story: "Rancho doesn't care about money symbols because he understands value. He drives a scooter but owns the school. Minimal wants, maximum contentment. He is already FIRE (Financial Independence), he just works for fun."
        },
        "farhan": {
            name: "Farhan Qureshi",
            role: "The Passion Chaser",
            traits: ["Balanced", "Dreams > Money", "Late Bloomer"],
            ruler: "Venus (Art)",
            quote: "Jeb mein paise kam hai, par dil mein sukoon hai.",
            color: "#20B2AA",
            img: "assets/farhan.png",
            finance_story: "Farhan chose passion (photography) over a high-paying engineer job. He earns less but lives more. His finances need to support his uneven income streams. A strong Emergency Fund is critical for his freelance lifestyle."
        },
        "simran": {
            name: "Simran (DDLJ)",
            role: "The Traditional Saver",
            traits: ["Family First", "Safety Seeker", "Gold Lover"],
            ruler: "Moon (Tradition)",
            quote: "Baoji ne kaha jee le zindagi... par budget mein.",
            color: "#DDA0DD",
            img: "assets/simran.png",
            finance_story: "Simran saves for family security, not personal luxury. She sacrifices her wants for the family's needs. Gold and FDs feel safe to her. She needs a gentle push into Index Funds to ensure her savings actually grow for the next generation."
        },
        "munna": {
            name: "Munna Bhai",
            role: "The Social Spender",
            traits: ["Heart of Gold", "Friends First", "Impulsive"],
            ruler: "Mars (Heart)",
            quote: "Jadoo ki jhappi... aur chai-sutta sabke liye!",
            color: "#DC143C",
            img: "assets/munna.png",
            finance_story: "Munna spends on people, not things. Treats, parties, helping friends in need. His heart is big, but so are his expenses. He needs a 'Social Budget' to limit his generosity before he gives it all away."
        },
        "circuit": {
            name: "Circuit",
            role: "The Loyal Follower",
            traits: ["Dependent", "No Ambition", "Day-to-Day"],
            ruler: "Ketu (Detachment)",
            quote: "Bhai ne bola karne ka, toh karne ka.",
            color: "#696969",
            img: "assets/circuit.png",
            finance_story: "Circuit has no personal financial goals because he thinks 'Bhai' will handle everything. He lives day-to-day. He needs to start thinking about his own future. Even a small ₹500 SIP is a start towards independence."
        },
        "rani": {
            name: "Rani (Queen)",
            role: "The Independent Traveler",
            traits: ["Smart Spender", "Self-Discovery", "Budget Travel"],
            ruler: "Mercury (Freedom)",
            quote: "Mera sense of humour bohot achha hai, finances bhi!",
            color: "#9370DB",
            img: "assets/rani.png",
            finance_story: "Rani turned her life around with a solo trip. She learned to manage money globally, spending on experiences but staying in hostels. She is financially smart but needs to translate that travel confidence into investment confidence."
        },
        "veeru": {
            name: "Veeru (Sholay)",
            role: "The Risk Taker",
            traits: ["Gambler", "Impulsive", "High Spirits"],
            ruler: "Rahu (Risk)",
            quote: "Aaj Basanti nahi, aaj lottery nachegi!",
            color: "#B22222",
            img: "assets/veeru.png",
            finance_story: "Veeru loves risk. Cards, bets, lotteries. He dreams of the one big win. He needs to redirect that adrenaline into 'High Risk High Reward' Small Cap funds instead of losing it in gambling. Equity is the casino where the house doesn't always win!"
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
