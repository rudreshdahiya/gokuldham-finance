import sys
import json
import traceback

print("Starting Excel Analysis...", flush=True)

try:
    import pandas as pd
    print("Pandas imported.", flush=True)
except ImportError as e:
    print(f"Error importing pandas: {e}", flush=True)
    sys.exit(1)

FILE_PATH = "/Users/rudresh/project-31/50 Macroeconomic Indicators.xlsx"

try:
    print(f"Attempting to read: {FILE_PATH}", flush=True)
    # Read the Excel file - force openpyxl engine
    xl = pd.ExcelFile(FILE_PATH, engine='openpyxl')
    print(f"Sheets found: {xl.sheet_names}", flush=True)

    summary = {}
    
    for sheet in xl.sheet_names:
        print(f"Scanning sheet: {sheet}", flush=True)
        df = pd.read_excel(FILE_PATH, sheet_name=sheet, engine='openpyxl')
        
        # Search for keywords in string columns
        # We convert to string and search "inflation", "cpi", "consumer price"
        # Also look for G-Sec
        
        found_keywords = []
        
        # Check headers
        for col in df.columns:
            c_str = str(col).lower()
            if any(x in c_str for x in ["inflation", "cpi", "consumer price", "g-sec", "yield", "rate"]):
                found_keywords.append(f"Header: {col}")
                
        # Check first 20 rows for metadata
        sample = df.head(20).astype(str)
        for idx, row in sample.iterrows():
            for col in df.columns:
                val = str(row[col]).lower()
                if any(x in val for x in ["inflation", "cpi", "consumer price", "yr g-sec"]):
                     found_keywords.append(f"Row {idx}: {val}")
        
        if found_keywords:
            summary[sheet] = found_keywords[:10] # Limit to 10 findings

    print("JSON_START")
    print(json.dumps(summary, indent=4, default=str))
    print("JSON_END")

except Exception as e:
    print("An error occurred:", flush=True)
    traceback.print_exc()
