import pandas as pd
import json
import sys

FILE_PATH = "/Users/rudresh/project-31/50 Macroeconomic Indicators.xlsx"

try:
    # Use openpyxl engine
    df = pd.read_excel(FILE_PATH, sheet_name=0, engine='openpyxl')
    
    # "Unnamed: 12" -> 10-Year G-Sec Yield
    # "Unnamed: 15" -> Policy Repo Rate
    # The data starts effectively from Row 3 (Index 2 in 0-based DataFrame)
    
    # Clean the data: drop rows where these columns are NaN
    # Columns are indices 12 and 15
    
    # Rename columns for clarity based on inspection
    df.rename(columns={
        "Unnamed: 12": "G_Sec_Yield",
        "Unnamed: 15": "Repo_Rate",
        "Unnamed: 1": "Period"
    }, inplace=True)
    
    # Filter for valid rows
    valid_data = df[["Period", "G_Sec_Yield", "Repo_Rate"]].dropna()
    
    # Get the latest entry (Topmost usually, based on the sample "2025-12-19")
    # Ensuring it's sorted by date if needed, but sample showed desc order
    
    latest = valid_data.iloc[0].to_dict()
    
    print(json.dumps(latest, indent=4, default=str))

except Exception as e:
    print(json.dumps({"error": str(e)}))
