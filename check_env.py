import sys

print("Checking environment...")
try:
    import pandas
    print(f"Pandas: {pandas.__version__}")
except ImportError:
    print("Pandas: Not Found")

try:
    import openpyxl
    print(f"OpenPyXL: {openpyxl.__version__}")
except ImportError:
    print("OpenPyXL: Not Found")
