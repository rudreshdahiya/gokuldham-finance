import json
import sys

# Load JSON
try:
    with open('/Users/rudresh/project-31/cpi_feb24.json', 'r') as f:
        data = json.load(f)
except Exception as e:
    print(f"Error loading file: {e}")
    sys.exit(1)

# Extract relevant rows for Rural+Urban (General Index)
# Structure: [Sector, Year, Month, ... General Index(last column)]
# General Index is index -1 (or 'ad' field)

rows = data.get('data', [])
feb_24_idx = None
feb_23_idx = None

for row in rows:
    sector = row[0]
    year = row[1]
    month = row[2]
    
    if sector == "Rural+Urban" and month == "February":
        if year == "2024":
            feb_24_idx = float(row[-1])
        elif year == "2023":
            feb_23_idx = float(row[-1])

if feb_24_idx and feb_23_idx:
    inflation = ((feb_24_idx - feb_23_idx) / feb_23_idx) * 100
    print(f"Feb 2023 Index: {feb_23_idx}")
    print(f"Feb 2024 Index: {feb_24_idx}")
    print(f"Inflation Rate: {inflation:.2f}%")
else:
    print("Could not find data for Feb 2023 or Feb 2024")
