import pulp
from pulp import LpMaximize, LpProblem, LpVariable, lpSum

class TaxOptimizer:
    def __init__(self):
        # Estimated Annual Returns (Conservative estimates for planning)
        self.returns = {
            "ELSS": 0.12,      # Equity Linked Savings Scheme
            "PPF": 0.071,      # Public Provident Fund
            "NIFTY": 0.12,     # Index Fund
            "FD": 0.065,       # Fixed Deposit
            "LIQUID": 0.06     # Liquid Fund
        }
        
        # Tax Rules (Simplified for Optimization)
        # ELSS & PPF are Tax Free under 80C (up to 1.5L)
        # NIFTY is 12.5% LTCG > 1.25L (We assume 10% avg tax drag for simplicity in linear model)
        # FD & LIQUID are taxed at Slab
        pass

    def optimize_portfolio(self, total_investment, risk_profile, tax_slab_pct=0.3):
        """
        Solves the Linear Programming Problem:
        Maximize: Post-Tax Returns
        Subject To: 
         1. 80C Limit (ELSS + PPF <= 1.5L)
         2. Total allocation = investment
         3. Risk Constraints
        """
        
        # 1. Define the Problem
        prob = LpProblem("Maximize_Post_Tax_Returns", LpMaximize)
        
        # 2. Define Variables (The "Knobs" the AI can turn)
        # Low Bound 0, Continuous variables
        elss = LpVariable("ELSS_Alloc", lowBound=0) 
        ppf = LpVariable("PPF_Alloc", lowBound=0)
        nifty = LpVariable("Nifty_Index_Alloc", lowBound=0)
        fd = LpVariable("FD_Alloc", lowBound=0)
        
        # 3. Calculate "Effective Return" (Return - Tax)
        # PPF: Exempt-Exempt-Exempt
        ret_ppf = self.returns["PPF"] 
        
        # ELSS: LTCG 12.5% > 1.25L. Assuming long term holding, approximate tax drag ~1%
        ret_elss = self.returns["ELSS"] * 0.9 
        
        # NIFTY: LTCG 12.5%. Tax drag ~1-2%
        ret_nifty = self.returns["NIFTY"] * 0.88
        
        # FD: Taxed at slab
        ret_fd = self.returns["FD"] * (1 - tax_slab_pct)

        # OBJECTIVE FUNCTION: Maximize Sum of (Allocation * EffectiveReturn)
        prob += (
            elss * ret_elss +
            ppf * ret_ppf +
            nifty * ret_nifty +
            fd * ret_fd
        ), "Total_Return"

        # CONSTRAINTS
        
        # C1: Total Pot Limit
        prob += (elss + ppf + nifty + fd == total_investment), "Total_Investment"
        
        # C2: 80C Limit (Section 80C caps tax deductions at 1.5L)
        # Note: We hard cap ELSS+PPF here. Logic: Doing more ELSS vs Nifty isn't tax efficient beyond limit
        # (Though ELSS lock-in is bad, returns are same as Nifty. So limit to 1.5L makes sense)
        prob += (elss + ppf <= 150000), "80C_Limit"
        
        # C3: Risk Constraints (Equity Exposure)
        total_equity = elss + nifty
        
        if risk_profile == 1: # Conservative (Max 30% Equity)
            prob += (total_equity <= 0.30 * total_investment), "Risk_Cap_Conservative"
        elif risk_profile == 2: # Moderate (Max 60% Equity)
             prob += (total_equity <= 0.60 * total_investment), "Risk_Cap_Moderate"
        # Aggressive (No hard cap, but general diversification implies not 100% usually, but LP allows it)

        # C4: Liquidity / Safety Floor (Always keep 10% in Debt/FD minimum)
        prob += (ppf + fd >= 0.10 * total_investment), "Safety_Floor"

        # 4. SOLVE
        status = prob.solve()
        
        # 5. Format Result
        return {
            "status": pulp.LpStatus[status],
            "allocation": {
                "ELSS (Tax Saver Equity)": round(elss.varValue),
                "PPF (Tax Saver Debt)": round(ppf.varValue),
                "Nifty Index (Growth)": round(nifty.varValue),
                "Fixed Deposit (Liquid)": round(fd.varValue)
            },
            "projected_return_1y": round(pulp.value(prob.objective)),
            "message": "Optimized for Section 80C utilization and Post-Tax Yield."
        }

optimizer = TaxOptimizer()
