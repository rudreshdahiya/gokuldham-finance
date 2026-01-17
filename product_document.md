# Gokuldham Bank: AI Private Client (Product Documentation)

> **Version:** 2.0 (Voxel Edition)
> **Status:** Released
> **Last Updated:** Jan 2026

## 1. Product Vision
**Gokuldham Bank** (formerly Spend-Trek) is an AI-powered financial profiling application that reimagines banking for the Indian market. It combines the relatable charm of the *Gokuldham Society* universe with institutional-grade financial logic.

**Core Value Proposition:**
-   **For the User:** A fun, judgment-free way to discover their "Financial Avatar" and get a serious, actionable investment plan.
-   **For the Bank:** A frictionless data-gathering tool that maps user behavior to NISM-compliant product recommendations.

### Key Pillars
1.  **Voxel Aesthetic:** A cohesive "Minecraft x Gokuldham" visual theme, featuring custom generated pixel-art avatars and environments.
2.  **Transaction Ledger UI:** A modern, GPay-inspired input interface where users "tag" expenses in a ledger rather than filling boring forms.
3.  **The Personalization Engine:** A logic core that profiles users into 16 distinct archetypes (e.g., *The Jethalal* - Risk Taker, *The Bhide* - Disciplined Saver).
4.  **Intelligent Telemetry:** Built with Microsoft Clarity and Sentry to track user behavior and application health.

---

## 2. User Flow & Experience

### **Screen 1: The Splash (Abdul's Shop)**
-   **UI:** A atmospheric night scene at "Abdul's Soda Shop" (Voxel Art).
-   **Action:** User clicks the "Soda Bottle" button.
-   **Transition:** Instant fade to the Ledger.

### **Screen 2: The Ledger (Input)**
-   **Interactive Passbook:** Replaces standard sliders with a **"Monthly Ledger"**.
-   **Tags & Icons:** Expenses appear as transaction rows (e.g., "🥦 Groceries", "✈️ Travel"), tagged as Needs/Wants/Savings.
-   **Expand-to-Edit:** Clicking a row expands it to reveal the allocation slider, mimicking a transaction detail view.
-   **Mobile First:** Stacked layout optimized for thumb-interaction on phones.
-   **Split View (Desktop):** A dual-pane layout with independent scrolling for inputs and a sticky "Visual Command Center" (Chart + Total) on the right.
-   **Strict 100% Logic:** Smart sliders that strictly prevent users from exceeding 100% allocation, ensuring error-free input.

### **Screen 3: The Passport (Result)**
-   **The Avatar:** A high-quality Voxel image of the user's Persona (e.g., Iyer, Popatlal).
-   **The Verdict:**
    -   **Natural Behavior:** The user's dominant financial trait.
    -   **Financial Prescription:** Detailed Equity/Debt/Gold splits.
    -   **Inspector Insight:** "Chalu Pandey" AI Chatbot (powered by Context-Aware API) offers specific advice based on the full ledger breakdown.

---

## 3. The Logic Core (`forensics_engine.js` & `script.js`)

### **A. Multi-Goal Bucket Strategy**
Unlike traditional calculators that force a single goal, Gokuldham Bank accepts an **Array of Goals**.
-   **Logic:** The engine calculates the required Corpus and SIP for *each* goal individually based on its Horizon (Time) and Cost.
-   **Blending:** It creates a weighted average "Blended Allocation" to satisfy all goals.

### **B. The Persona Matrix (16 Archetypes)**
Refined logic ensures nuanced profiling:
-   **Jethalal (Risk Taker):** Triggered by High Debt or Business Goals.
-   **Popatlal (Hoarder):** Savings rate > 72% with "Marriage" anxiety.
-   **Bhide (Conservative):** High Savings + "Safety" Goal.
-   **Bagha/Natu Kaka:** Mapped to specific income/loyalty traits.

### **C. Inspector Context Protocol**
-   **Context-Aware:** The `askInspector` function scrapes the *entire* ledger state (e.g., "Dining: 10% (Wants)"), active goals, and calculated persona.
-   **Payload:** This rich context is sent to the backend, enabling the AI to give specific, personalized advice (e.g., "Cut down on your 10% dining spend, Tapu!").

---

## 4. Technical Architecture
-   **Frontend:** Vanilla JS + CSS3 (Mobile Responsive). Lightweight & Fast.
-   **Visuals:** Pre-generated Voxel Assets (PNG/WebP) in `assets/` directory. No heavy 3D/Three.js runtime to ensure performance.
-   **State Management:** `localStorage` for session persistence.
-   **Analytics:**
    -   **Microsoft Clarity:** Heatmaps & Session Recording.
    -   **Sentry:** Real-time crash reporting & error tracking.
-   **Deployment:** Static files (`index.html`, `script.js`, `styles.css`) deployable on any CDN (Netlify/Vercel).

