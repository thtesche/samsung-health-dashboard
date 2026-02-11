import pandas as pd
import os
from typing import Dict, Any

class DataLoader:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.cache: Dict[str, pd.DataFrame] = {}

    def load_csv(self, filename: str) -> pd.DataFrame:
        """Loads a CSV file into a pandas DataFrame, with caching."""
        if filename in self.cache:
            return self.cache[filename]
        
        file_path = os.path.join(self.data_dir, filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        try:
            df = pd.read_csv(file_path)
            # Basic cleaning: convert columns with 'time' or 'date' to datetime objects if possible
            for col in df.columns:
                if 'time' in col.lower() or 'date' in col.lower():
                    try:
                        df[col] = pd.to_datetime(df[col])
                    except (ValueError, TypeError):
                        pass # Keep as is if conversion fails

            self.cache[filename] = df
            return df
        except Exception as e:
            raise RuntimeError(f"Error loading {filename}: {e}")

    def get_summary(self, filename: str) -> Dict[str, Any]:
        """Returns a simple statistical summary of the data."""
        df = self.load_csv(filename)
        description = df.describe(include='all').to_dict()
        # Convert timestamps to strings for JSON serialization
        return description

    def get_all_data_files(self) -> list[str]:
        """Returns a list of all CSV files in the data directory."""
        return [f for f in os.listdir(self.data_dir) if f.endswith('.csv')]
