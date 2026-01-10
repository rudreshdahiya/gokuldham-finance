# Gokuldham Bank: AI Private Client (Product Documentation)

> **Version:** 1.0 (Release Candidate)
> **Status:** Phase 6 Complete (Refinement & Overhaul)

## 1. Product Vision
**Gokuldham Bank** (formerly Spend-Trek) is an AI-powered financial profiling application that reimagines banking for the Indian market. It combines the relatable charm of the *Gokuldham Society* universe with institutional-grade financial logic.

**Core Value Proposition:**
-   **For the User:** A fun, judgment-free way to discover their "Financial Avatar" and get a serious, actionable investment plan.
-   **For the Bank:** A frictionless data-gathering tool that maps user behavior to NISM-compliant product recommendations without the boredom of traditional forms.

### Key Pillars
1.  **Voxel UX:** A retro-modern 3D interface that treats financial inputs like building blocks.
2.  **Smart Inputs:** Dropdowns and Sliders aligned with standard UPI categories (Groceries, Dining, Travel), minimizing cognitive load.
3.  **The Personalization Engine:** A logic core that profiles users into 16 distinct archetypes (e.g., *The Jethalal* - Risk Taker, *The Bhide* - Disciplined Saver).
4.  **Multi-Goal Bucket Strategy:** A sophisticated recommendation engine that blends multiple conflicting goals (e.g., "FIRE" + "Wedding") into a single, cohesive asset allocation plan.

---

## 2. User Flow & Experience

### **Screen 1: The Vault (Splash)**
-   **UI:** A glitch-art inspired "Open Vault" animation.
-   **Action:** User clicks `OPEN_VAULT.EXE`.
-   **Transition:** Camera zooms into the 3D Money-Verse.

### **Screen 2: The Data Terminal (Input)**
-   **Multi-Goal Selection:** Users can select up to 3 financial goals via a **"Pill UI"** (e.g., `FIRE` + `Home`). Tooltips provide "Primers" explaining each goal.
-   **Dynamic Sliders:** Input fields for Income and Spending Breakdown (Needs/Wants/Savings), with real-time clamping to ensure 100% total.
-   **Action:** "RUN_DIAGNOSTIC" triggers the Analysis Engine.

### **Screen 3: The Result (Passport)**
-   **The Avatar:** A 3D Voxel representation of the user's Persona (e.g., Iyer, Popatlal).
-   **The Verdict:**
    -   **Natural Behavior:** The user's dominant financial trait (e.g., "Impulsive Spender").
    -   **Financial Prescription:** A detailed investment table showing Equity/Debt/Gold splits.
    -   **Strategic Cues:** Specific advice on **Rebalancing** (e.g., "Quarterly Review") and **Tax Efficiency** (e.g., "Utilize Section 54F").

---

## 3. The Logic Core (`forensics_engine.js`)

### **A. Multi-Goal Bucket Strategy**
Unlike traditional calculators that force a single goal, Gokuldham Bank accepts an **Array of Goals**.
-   **Logic:** The engine calculates the required Corpus and SIP for *each* goal individually based on its Horizon (Time) and Cost.
-   **Blending:** It then creates a weighted average "Blended Allocation".
    -   *Example:* Short Term Goal (Debt Heavy) + Long Term Goal (Equity Heavy) = Moderate Balanced Portfolio.

### **B. The Persona Matrix (16 Archetypes)**
Refined logic to ensure balanced distribution (< 20% per persona).
-   **Jethalal (Risk Taker):** Triggered by High Debt (>40%) or Negative Net Worth.
-   **Popatlal (Hoarder):** Savings rate > 72%.
-   **Bhide (Conservative):** High Savings + "Safety" Goal.
-   **Babita/Roshan/Daya:** Triggered by specific discretionary spending spikes (Shopping/Dining/Travel).

### **C. Tax & Rebalancing Intelligence**
-   **Tax Planning:** Maps goals to specific Indian tax sections (80C, 80D, 24b, LTCG).
-   **Rebalancing:** Assigns review frequency maps based on Risk Profile (Aggressive -> Quarterly, Conservative -> Annual).

---

## 4. Technical Architecture
-   **Frontend:** Vanilla JS + THREE.js (for Voxel rendering). No Heavy Frameworks.
-   **State Management:** `localStorage` for session persistence.
-   **AI Integration:** Modular architecture ready to plug into Perplexity/OpenAI APIs for "Consult Inspector" features.
-   **Deployment:** Static files (`index.html`, `script.js`, `styles.css`) deployable on any CDN (Netlify/Vercel).
