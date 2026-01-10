# Research Notes: Financial Prescription Engine

## 1. Financial Goals (Indian Context)
Based on SEBI/AMFI guidelines:

**Essential/Basic:**
-   **Emergency Fund**: 6 months of absolute expenses. (Liquid/Cash)
-   **Life Insurance**: Term plan (Risk coverage).
-   **Health Insurance**: Medical coverage.

**Short-Term (< 3 Years):**
-   **Vacation**: Europe/Domestic.
-   **Gadgets**: iPhone/Laptop.
-   **Vehicle**: Bike/Car Down Payment.
-   **Debt Repayment**: Credit Card/Personal Loan.

**Medium-Term (3-7 Years):**
-   **Wedding**: Own or Sibling/Child.
-   **Home Renovation**: Upgrades/Interiors.
-   **Education**: Upskilling/Masters.
-   **Vehicle**: Full Purchase.

**Long-Term (> 7 Years):**
-   **Retirement**: The "Number".
-   **Home Purchase**: Tier 1 City (Expensive) vs Tier 2.
-   **Child Education**: Higher Ed (Domestic vs International).
-   **Wealth Creation**: Financial Freedom (FIRE).

## 2. Asset Allocation Rules (The Logic)
**Base Rule:** 100 - Age = Equity % (Classic Rule).
**Modified Rule (Risk Profile Adjusted):**

| Risk Profile | Equity (Large/Mid/Small) | Debt (Liquid/Bonds) | Gold |
| :--- | :--- | :--- | :--- |
| **Conservative** (Low Risk) | 20-30% | 60-70% | 5-10% |
| **Moderate** (Balanced) | 40-60% | 30-40% | 5-10% |
| **Aggressive** (High Growth) | 70-80% | 10-20% | 5-10% |

**Sub-Asset Classes (SEBI Categories):**
-   **Equity**: Large Cap (Safe growth), Mid Cap (High growth), Small Cap (Aggressive), Flexi Cap.
-   **Debt**: Liquid Funds (Emergency), Corporate Bonds, Gilt (Long term safe).
-   **Hybrid**: Balanced Advantage (Dynamic), Multi-Asset.

## 3. Inputs Required for Prescription
To generate the "Prescription", we need:
1.  **Age**: Determines horizon and basic risk capacity.
2.  **Monthly Income**: Capacity to invest.
3.  **Current Spend Pattern** (from Tracker):
    -   *High Savings* -> Aggressive capacity.
    -   *High Fixed Costs (Rent/EMI)* -> Lower risk capacity (needs liquidity).
4.  **Selected Goals**:
    -   *Short Term Goal Selected?* -> Shift allocation towards Debt.
    -   *Long Term Goal Only?* -> Shift allocation towards Equity.
5.  **Macro Factors** (Optional but Cool):
    -   *High Inflation?* -> Hedge with Gold/Equity.
    -   *High Interest Rates?* -> Lock in Debt.

## 4. The "Prescription" Output Format
The user wants a "Financial Prescription Engine".
It should output:
-   **Emergency Fund Recommended**: ₹X Amount.
-   **Goal SIPs**: "For [Goal A], invest ₹Y/month in [Fund Category]."
-   **General Portfolio Split**: Pie chart of recommended Asset Allocation.
