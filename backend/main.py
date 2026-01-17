from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from ml_engine import ml_engine
from inspector import inspector
from optimizer import optimizer

app = FastAPI(title="Gokuldham Bank AI Backend")

# CORS (Allow Frontend to talk to Backend)
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://gokuldham-finance.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Explicit origins for security & credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class PersonaInput(BaseModel):
    age_group: str
    state: str
    income: float
    needs_pct: float
    wants_pct: float
    savings_pct: float

class PrescriptionInput(BaseModel):
    age: int
    income: float
    horizon_years: int
    risk_tolerance: int # 1, 2, 3

class InspectorInput(BaseModel):
    context: dict
    question: str

class OptimizationInput(BaseModel):
    investment_amount: float
    risk_profile: int # 1, 2, 3

# --- ENDPOINTS ---

@app.get("/")
def health_check():
    return {"status": "online", "system": "Gokuldham AI Core"}

@app.post("/analyze/persona")
def analyze_persona(data: PersonaInput):
    """
    Predicts the user's Financial Persona using K-Means Clustering.
    """
    try:
        result = ml_engine.predict_persona(data.needs_pct, data.wants_pct, data.savings_pct)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/prescription")
def get_prescription(data: PrescriptionInput):
    """
    Predicts Asset Allocation using Random Forest.
    """
    try:
        result = ml_engine.predict_prescription(data.age, data.income, data.horizon_years, data.risk_tolerance)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/inspector/ask")
def ask_inspector(data: InspectorInput):
    """
    Chat with Inspector Chalu Pandey (Gemini).
    """
    return {"answer": inspector.analyze_case(data.context, data.question)}

@app.post("/analyze/optimize")
def optimize_portfolio(data: OptimizationInput):
    """
    Solves Linear Programming problem for Max Post-Tax Returns.
    """
    try:
        result = optimizer.optimize_portfolio(data.investment_amount, data.risk_profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Startup Event
@app.on_event("startup")
async def startup_event():
    # Train/Load Models on Startup
    ml_engine.train_persona_model()
    ml_engine.train_prescription_model()
