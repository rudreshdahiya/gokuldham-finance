
# Bollywood Finance Walkthrough

## 1. Overview
We have successfully transformed the legacy "Gokuldham Bank" into **Bollywood Finance**. The application now uses 16 detailed Bollywood personas to categorize user financial behavior.

## 2. Persona Engine (V3 Tuned)
The logic in `forensics_engine.js` has been tuned using Monte Carlo simulations (N=50,000) to ensure fairness.

### Distribution (Verified):
- **Mass Market (17%):** Shyam (The Balanced Worker)
- **Common (7-9%):** Munna, Raj, Simran, Baburao.
- **Niche (3%):** Poo (High Spender), Rancho (High Saver).
- **Strugglers (1-2%):** Pushpa (High Needs).

## 3. The 16 Personas
| Persona | Archetype | Key Trait | "Level Up" Path |
|:---|:---|:---|:---|
| **Poo** | Shopping Queen | Spender | Evolve to **Chatur** (Asset Rich) |
| **Bunny** | Traveler | Spender | Evolve to **Farhan** (Balanced Passion) |
| **Geet** | Impulsive | Spender | Evolve to **Rani** (Smart Traveler) |
| **Raj** | Rich Lifestyle | Spender | Evolve to **Rancho** (Minimalist) |
| **Pushpa** | Hustler | Survivor | Evolve to **Circuit** (Loyal) |
| **Raju** | Schemer | Spender | Evolve to **Shyam** (Stable) |
| **Baburao** | Frugal | Saver | Evolve to **Simran** (Traditional) |
| **Shyam** | Balanced | Worker | Evolve to **Farhan** (Passion) |
| **Chatur** | Asset Heavy | Flexer | Evolve to **Raj** (Generic Wealth) |
| **Rancho** | Minimalist | Independent | **TOP LEVEL (Enlightened)** |
| **Farhan** | Passionate | Balanced | Evolve to **Rancho** |
| **Simran** | Traditional | Saver | Evolve to **Rancho** |
| **Munna** | Social | Spender | Evolve to **Raj** |
| **Circuit** | Follower | Survivor | Evolve to **Shyam** |
| **Rani** | Smart Traveler | Balanced | Evolve to **Simran** |
| **Veeru** | Gambler | Risk Taker | Evolve to **Munna** |

## 4. Gamification Features (NEW)
We added a **"Level Up"** system in the UI:
1.  **Finance Story:** A personalized narrative explaining *why* they are this persona (e.g., "Poo treats credit cards like magic wands").
2.  **Evolution Path:** A specific "Next Level Unlock" card that shows the next persona in their journey (e.g., Raju -> Shyam).
3.  **Neighbor Logic:** Improved "Closest Matches" using a heuristic allocation map to show *directional* advice (e.g., "Saves 10% more than you").

## 5. Assets
We generated placeholder avatars for all 16 personas in `assets/`. These are color-coded with initials/names for immediate testing.

## 6. Next Steps
- **Production Images:** Replace `assets/*.png` with real Bollywood caricatures.
- **Social Share:** Add a "Share My Persona" button to generate a viral card.
