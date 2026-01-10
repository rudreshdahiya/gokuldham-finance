import csv
import random

# CONFIGURATION
COUNT = 1000

# RISK MAPPING
# 1 = Conservative, 2 = Moderate, 3 = Aggressive
RISK_LEVELS = [1, 2, 3]

def generate_allocation():
    # INPUTS (Features)
    age = random.randint(18, 70)
    income = random.randint(30000, 500000)
    horizon_years = random.randint(1, 25)
    
    # Heuristic Logic to create "Ground Truth" for ML to learn
    # Base Rule: 100 - Age (Standard Rule of Thumb)
    base_equity = 100 - age
    
    # Horizon Adjustment
    if horizon_years < 3:
        base_equity = 0 # Very short term = No Equity
    elif horizon_years < 5:
        base_equity = min(base_equity, 30) # Short term = Low Equity
    elif horizon_years > 15:
        base_equity += 10 # Long term boost
        
    # Risk Profile Simulation (Random for variety)
    risk_tolerance = random.choice(RISK_LEVELS)
    
    if risk_tolerance == 1: # Conservative
        base_equity -= 20
    elif risk_tolerance == 3: # Aggressive
        base_equity += 20
        
    # Clamping
    base_equity = max(0, min(95, base_equity))
    
    # Gold & Debt
    gold = random.randint(5, 15) # Always some gold
    debt = 100 - base_equity - gold
    
    # Final Clamp Check
    if debt < 0:
        base_equity += debt # reduce equity
        debt = 0
        
    return [age, income, horizon_years, risk_tolerance, base_equity, debt, gold]

# GENERATE
with open('dataset_allocations.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["Age", "Income", "HorizonYears", "RiskTolerance", "EquityPct", "DebtPct", "GoldPct"])
    for _ in range(COUNT):
        writer.writerow(generate_allocation())

print(f"✅ Generated {COUNT} rows in dataset_allocations.csv")
