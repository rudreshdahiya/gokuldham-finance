import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.multioutput import MultiOutputRegressor
import pickle
import os

class MLEngine:
    def __init__(self):
        self.persona_model = None
        self.scaler = None
        self.data_path = "../dataset_personas.csv"
        self.allocations_path = "../dataset_allocations.csv"
        self.model_path = "persona_kmeans.pkl"
        self.prescription_model = None

    def load_data(self):
        """Loads the synthetic dataset."""
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Dataset not found at {self.data_path}")
        return pd.read_csv(self.data_path)

    def train_persona_model(self):
        """Trains K-Means on the dataset."""
        print("🧠 Training Persona Model (K-Means)...")
        df = self.load_data()
        
        # Features: Needs%, Wants%, Savings% (Normalized)
        features = df[['NeedsPct', 'WantsPct', 'SavingsPct']]
        
        # Scale Data
        self.scaler = StandardScaler()
        scaled_features = self.scaler.fit_transform(features)
        
        # Train K-Means (16 Clusters for 16 Personas)
        self.persona_model = KMeans(n_clusters=16, random_state=42)
        self.persona_model.fit(scaled_features)
        
        # Map Clusters to Labels (Simplified approach: We map the centroid to the most frequent label in that cluster)
        df['Cluster'] = self.persona_model.labels_
        self.cluster_map = df.groupby('Cluster')['PersonaLabel'].agg(lambda x: x.mode()[0]).to_dict()
        
        print("✅ Model Trained. Cluster Map:", self.cluster_map)
        return self.cluster_map

    def predict_persona(self, needs, wants, savings):
        """Predicts persona for a new user."""
        if not self.persona_model:
            self.train_persona_model()
            
        # Preprocess input
        input_data = np.array([[needs, wants, savings]])
        scaled_input = self.scaler.transform(input_data)
        
        # Predict
        cluster_id = self.persona_model.predict(scaled_input)[0]
        persona_label = self.cluster_map.get(cluster_id, "unknown")
        
        return {
            "persona": persona_label,
            "cluster_id": int(cluster_id),
            "confidence": "High (K-Means Distance)"
        }

    def train_prescription_model(self):
        """Trains Random Forest for Asset Allocation."""
        print("🧠 Training Prescription Model (Random Forest)...")
        if not os.path.exists(self.allocations_path):
             print("⚠️ Allocation Dataset not found. Skipping Prescription Model.")
             return

        df = pd.read_csv(self.allocations_path)
        
        # Features: Age, Income, HorizonYears, RiskTolerance
        X = df[['Age', 'Income', 'HorizonYears', 'RiskTolerance']]
        # Target: EquityPct, DebtPct, GoldPct
        y = df[['EquityPct', 'DebtPct', 'GoldPct']]
        
        # Train Multi-Output Random Forest
        rf = RandomForestRegressor(n_estimators=100, random_state=42)
        self.prescription_model = MultiOutputRegressor(rf)
        self.prescription_model.fit(X, y)
        
        print("✅ Prescription Model Trained.")

    def predict_prescription(self, age, income, horizon_years, risk_tolerance):
        """Predicts asset allocation."""
        if not self.prescription_model:
            self.train_prescription_model()
            if not self.prescription_model:
                return {"error": "Model not trained"}
        
        # Prediction
        input_data = np.array([[age, income, horizon_years, risk_tolerance]])
        prediction = self.prescription_model.predict(input_data)[0]
        
        return {
            "equity": round(prediction[0]),
            "debt": round(prediction[1]),
            "gold": round(prediction[2]),
            "confidence": "High (Random Forest Vote)"
        }

# Singleton Instance
ml_engine = MLEngine()
