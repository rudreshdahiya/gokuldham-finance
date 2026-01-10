import csv
import random

# CONFIGURATION
COUNT = 1000
STATES = ["Maharashtra", "Bihar", "Goa", "Delhi", "Karnataka", "Kerala", "UP", "Rajasthan"]
PERSONAS = [
    # SAVERS
    "bhide", "iyer", "popatlal", "sodhi", "madhavi", "champaklal",
    # SPENDERS
    "jethalal", "babita", "roshan", "daya", "tapu", "komal", "anjali", "bagha", "abdul", "mehta"
]

def generate_profile():
    # 1. Base Demographics
    age = random.choice(["18-22", "22-28", "29-39", "40-60", "60+"])
    state = random.choice(STATES)
    income = random.randint(30000, 300000)
    
    # 2. Logic to Bias Data (So the ML has patterns to find)
    # We assign a "True Persona" first, then generate stats that match it.
    true_persona = random.choice(PERSONAS)
    
    needs, wants, savings = 0, 0, 0
    debt_load = 0
    
    if true_persona == "jethalal":
        # Risk Taker: Low Savings, High Debt or High Wants
        savings = random.randint(-5, 10) # Can be negative (debt)
        wants = random.randint(40, 60)
        debt_load = random.randint(40, 80)
        needs = 100 - wants - (0 if savings < 0 else savings)
        
    elif true_persona == "popatlal":
        # Hoarder: Extreme Savings
        savings = random.randint(70, 90)
        needs = random.randint(10, 25)
        wants = 100 - savings - needs
        debt_load = 0
        
    elif true_persona == "bhide":
        # Disciplined: High Savings, Low Risk
        savings = random.randint(45, 60)
        needs = random.randint(30, 40)
        wants = 100 - savings - needs
        debt_load = 0
        
    elif true_persona == "abdul":
        # Survivor: High Needs
        needs = random.randint(70, 90)
        savings = random.randint(0, 10)
        wants = 100 - savings - needs
        debt_load = random.randint(0, 20)
        
    elif true_persona == "babita":
        # Spender: High Wants (Shopping)
        wants = random.randint(50, 70)
        needs = random.randint(20, 30)
        savings = 100 - wants - needs
        debt_load = random.randint(10, 30)

    else:
        # General Random distribution for others (simplified for now)
        savings = random.randint(10, 40)
        needs = random.randint(30, 50)
        wants = 100 - savings - needs
        debt_load = random.randint(0, 15)

    # Normalization Check
    total = needs + wants + savings
    if total != 100:
        diff = 100 - total
        wants += diff 
        
    return [age, state, income, needs, wants, savings, debt_load, true_persona]

# GENERATE
with open('dataset_personas.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["AgeGroup", "State", "Income", "NeedsPct", "WantsPct", "SavingsPct", "DebtLoad", "PersonaLabel"])
    for _ in range(COUNT):
        writer.writerow(generate_profile())

print(f"✅ Generated {COUNT} rows in dataset_personas.csv")
