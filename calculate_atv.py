import os
import json
import sys

BASE_PATH = "/Users/rudresh/project-31/pulse-master/data/aggregated/transaction/country/india/state"

def calculate_state_atv():
    results = {}
    
    if not os.path.exists(BASE_PATH):
        print(json.dumps({"error": f"Path not found: {BASE_PATH}"}))
        return

    states = [d for d in os.listdir(BASE_PATH) if os.path.isdir(os.path.join(BASE_PATH, d))]
    
    for state in states:
        state_path = os.path.join(BASE_PATH, state)
        # Try 2024 Q1, then 2023 Q4, etc.
        data_file = None
        for year in ["2024", "2023"]:
            if data_file: break
            for quarter in ["1", "4", "3", "2"]:
                f = os.path.join(state_path, year, f"{quarter}.json")
                if os.path.exists(f):
                    data_file = f
                    break
        
        if not data_file:
            continue

        try:
            with open(data_file, 'r') as f:
                data = json.load(f)
                
            # Extract Total Amount and Count
            # Structure: data.data.transactionData[] -> element.paymentInstruments[0]
            
            transactions = data.get("data", {}).get("transactionData", [])
            state_amount = 0
            state_count = 0
            
            for t in transactions:
                # "name": "Merchant payments" or "Peer-to-peer payments" etc
                # We want aggregate
                instruments = t.get("paymentInstruments", [])
                for i in instruments:
                    state_amount += i.get("amount", 0)
                    state_count += i.get("count", 0)
            
            if state_count > 0:
                atv = state_amount / state_count
                results[state] = round(atv, 2)
            else:
                results[state] = 0

        except Exception as e:
            # Silently skip errors for cleaner output, or log to stderr
            sys.stderr.write(f"Error processing {state}: {str(e)}\n")

    print(json.dumps(results, indent=4))

if __name__ == "__main__":
    calculate_state_atv()
