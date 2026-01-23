
import os
import shutil
import glob
import re

# Paths
BRAIN_DIR = "/Users/rudresh/.gemini/antigravity/brain/caafccb8-75e1-43e1-b389-bc7d75dba182"
PROJECT_ASSETS = "/Users/rudresh/project-31/assets"

# Personas list to verify
PERSONAS = [
    "poo", "raju", "baburao", "shyam", "circuit", "munna", "rancho", "farhan",
    "geet", "bunny", "pushpa", "veeru", "simran", "rani", "chatur", "raj"
]

def deploy_assets():
    if not os.path.exists(PROJECT_ASSETS):
        os.makedirs(PROJECT_ASSETS)

    print("Deploying Assets...")
    
    for persona in PERSONAS:
        # Find latest v1 image for likely matches
        pattern = os.path.join(BRAIN_DIR, f"{persona}_v1_*.png")
        files = glob.glob(pattern)
        
        if not files:
            print(f"WARNING: No image found for {persona}!")
            continue
            
        # Get the most recent file
        latest_file = max(files, key=os.path.getctime)
        
        target_path = os.path.join(PROJECT_ASSETS, f"{persona}.png")
        shutil.copy2(latest_file, target_path)
        print(f"✅ Deployed {persona}.png")

if __name__ == "__main__":
    deploy_assets()
