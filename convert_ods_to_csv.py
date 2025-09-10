#!/usr/bin/env python3
"""
Convert ODS file to CSV format for web upload.
Usage: python convert_ods_to_csv.py input.ods output.csv
"""
import sys
import pandas as pd

def convert_ods_to_csv(ods_path: str, csv_path: str):
    """Convert ODS file to CSV format."""
    try:
        # Read the ODS file
        df = pd.read_excel(ods_path, engine="odf")
        
        # Save as CSV
        df.to_csv(csv_path, index=False)
        print(f"Successfully converted {ods_path} to {csv_path}")
        print(f"Columns found: {', '.join(df.columns)}")
        print(f"Rows: {len(df)}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_ods_to_csv.py input.ods output.csv")
        sys.exit(1)
    
    ods_file = sys.argv[1]
    csv_file = sys.argv[2]
    convert_ods_to_csv(ods_file, csv_file)
