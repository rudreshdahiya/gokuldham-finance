import csv
import random
import os

# CONFIGURATION
COUNT = 2000
OUTPUT_FILE = "dataset_personas.csv" # Relative to where script is run

STATES = ["Maharashtra", "Bihar", "Goa", "Delhi", "Karnataka", "Kerala", "UP", "Rajasthan"]

# FINANCIAL PROFILES (Target Ranges)
# Each tuple: (NeedsMin, NeedsMax, WantsMin, WantsMax, SavingsMin, SavingsMax)
PERSONA_PROFILES = {
    # 1. THE SAVERS
    "bhide":        {"s": (40, 60), "w": (10, 30), "n": (30, 50)},
    "popatlal":     {"s": (60, 85), "w": (0, 15),  "n": (10, 30)},
    "champaklal":   {"s": (50, 70), "w": (5, 20),  "n": (20, 40)},
    "madhavi":      {"s": (30, 50), "w": (20, 30), "n": (30, 50)},
    "iyer":         {"s": (25, 45), "w": (25, 35), "n": (30, 45)},

    # 2. THE SPENDERS
    "jethalal":     {"s": (-10, 10), "w": (40, 70), "n": (30, 50)},
    "babita":       {"s": (5, 20),   "w": (50, 75), "n": (20, 40)},
    "sodhi":        {"s": (10, 25),  "w": (50, 60), "n": (25, 40)},
    "roshan":       {"s": (15, 30),  "w": (45, 60), "n": (25, 40)},
    "tapu":         {"s": (0, 15),   "w": (60, 80), "n": (15, 30)},
    "daya":         {"s": (10, 20),  "w": (40, 60), "n": (30, 50)},

    # 3. THE BALANCED / STRUGGLERS
    "mehta":        {"s": (20, 35),  "w": (20, 35), "n": (40, 50)},
    "anjali":       {"s": (25, 40),  "w": (15, 30), "n": (40, 60)},
    "abdul":        {"s": (0, 5),    "w": (5, 15),  "n": (80, 95)},
    "bagha":        {"s": (5, 15),   "w": (20, 30), "n": (60, 75)},
    "komal":        {"s": (10, 25),  "w": (30, 45), "n": (40, 60)},
}

def get_random_in_range(r):
    return random.randint(r[0], r[1])

def generate_profile():
    true_persona = random.choice(list(PERSONA_PROFILES.keys()))
    profile = PERSONA_PROFILES[true_persona]

    savings = get_random_in_range(profile["s"])
    wants = get_random_in_range(profile["w"])
    needs = 100 - savings - wants
    
    # Priority Adjustments based on Persona Archetype
    if true_persona in ["abdul", "bagha"]:
        needs = get_random_in_range(profile["n"])
        savings = get_random_in_range(profile["s"])
        wants = 100 - needs - savings
    elif true_persona in ["popatlal", "bhide"]:
        savings = get_random_in_range(profile["s"])
        needs = get_random_in_range(profile["n"])
        wants = 100 - savings - needs
    elif true_persona in ["babita", "tapu"]:
        wants = get_random_in_range(profile["w"])
        needs = get_random_in_range(profile["n"])
        savings = 100 - wants - needs
        
    # Sanity Checks
    if true_persona != "jethalal" and savings < 0:
        wants += savings
        savings = 0
    if wants < 0: wants = 0
    if needs < 0: needs = 0
    
    total = needs + wants + savings
    if total != 100:
        diff = 100 - total
        if random.random() > 0.5: wants += diff
        else: needs += diff

    age = random.choice(["18-22", "22-28", "29-39", "40-60", "60+"])
    if true_persona == "tapu": age = "18-22"
    if true_persona == "champaklal": age = "60+"
    
    state = random.choice(STATES)
    income = random.randint(20000, 300000)
    
    if true_persona == "abdul": income = random.randint(15000, 40000)
    if true_persona == "jethalal": income = random.randint(100000, 500000)

    debt_load = 0
    if savings < 10: debt_load = random.randint(10, 80)
    if true_persona == "jethalal": debt_load = random.randint(20, 90)

    return [age, state, income, needs, wants, savings, debt_load, true_persona]

if __name__ == "__main__":
    print(f"🚀 Generating {COUNT} personas...")
    with open(OUTPUT_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["AgeGroup", "State", "Income", "NeedsPct", "WantsPct", "SavingsPct", "DebtLoad", "PersonaLabel"])
        for _ in range(COUNT):
            writer.writerow(generate_profile())
    print(f"✅ Generated {COUNT} rows in {OUTPUT_FILE}")
