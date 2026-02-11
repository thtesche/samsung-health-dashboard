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

    def get_data_for_period(self, filename: str, days: int = 30) -> pd.DataFrame:
        """Loads data and filters it for the last N days based on 'create_time' or 'start_time'."""
        df = self.load_csv(filename)
        
        # Identify time column
        time_col = None
        for col in ['create_time', 'start_time', 'time']:
            if col in df.columns:
                time_col = col
                break
        
        if not time_col:
            return df # Cannot filter if no time column found
            
        # Ensure it's datetime
        df[time_col] = pd.to_datetime(df[time_col])
        
        # Filter for last N days
        cutoff = pd.Timestamp.now() - pd.Timedelta(days=days)
        return df[df[time_col] >= cutoff]

    def aggregate_heart_rate_data(self, days: int = 30) -> Dict[str, Any]:
        """Aggregates heart rate and HRV data for advanced analysis."""
        summary = {}
        try:
            def safe_fetch_range(filename, start_days, end_days):
                try:
                    df = self.load_csv(filename)
                    time_col = next((c for c in ['create_time', 'start_time', 'time'] if c in df.columns), None)
                    if not time_col: return df
                    df[time_col] = pd.to_datetime(df[time_col])
                    now = pd.Timestamp.now()
                    cutoff_start = now - pd.Timedelta(days=start_days)
                    cutoff_end = now - pd.Timedelta(days=end_days)
                    return df[(df[time_col] >= cutoff_start) & (df[time_col] < cutoff_end)]
                except:
                    return pd.DataFrame()

            import numpy as np
            def add_polynomial_trend(data_list, value_key, degree=5):
                if not data_list or len(data_list) < degree + 1: return data_list
                try:
                    y = np.array([d[value_key] for d in data_list])
                    x = np.arange(len(y))
                    coeffs = np.polyfit(x, y, degree)
                    p = np.poly1d(coeffs)
                    trend_vals = p(x)
                    for i, d in enumerate(data_list):
                        d['trend_line'] = trend_vals[i]
                except:
                    pass
                return data_list

            hr_df = safe_fetch_range("heart_rate.csv", days, 0)
            prev_hr_df = safe_fetch_range("heart_rate.csv", days * 2, days)
            
            vitality_df = safe_fetch_range("vitality_score.csv", days, 0)
            prev_vitality_df = safe_fetch_range("vitality_score.csv", days * 2, days)

            sleep_df = safe_fetch_range("sleep.csv", days, 0)

            def calc_trend(curr_val, prev_val):
                if not curr_val or not prev_val or prev_val == 0: return 0
                return ((curr_val - prev_val) / prev_val) * 100

            hr_metrics = []
            if not hr_df.empty:
                # Samples for the chart (grouped by day)
                df_grouped = hr_df.copy()
                time_col = next((c for c in ['create_time', 'start_time', 'time'] if c in df_grouped.columns), None)
                df_grouped['day'] = df_grouped[time_col].dt.strftime('%Y-%m-%d')
                hr_metrics = df_grouped.groupby('day')['heart_rate'].mean().reset_index().to_dict(orient='records')
                hr_metrics = add_polynomial_trend(hr_metrics, 'heart_rate')

            # Sleeping HR Calculation
            sleeping_hr_metrics = []
            sleeping_hr_avg = None
            if not sleep_df.empty and not hr_df.empty:
                session_averages = []
                # Ensure datetime for comparison
                hr_temp = hr_df.copy()
                hr_time_col = next((c for c in ['create_time', 'start_time', 'time'] if c in hr_temp.columns), None)
                hr_temp[hr_time_col] = pd.to_datetime(hr_temp[hr_time_col])
                
                for _, session in sleep_df.iterrows():
                    start = pd.to_datetime(session['start_time'])
                    end = pd.to_datetime(session['end_time'])
                    # Filter HR for this session
                    session_hr = hr_temp[(hr_temp[hr_time_col] >= start) & (hr_temp[hr_time_col] <= end)]
                    if not session_hr.empty:
                        avg_hr = session_hr['heart_rate'].mean()
                        session_averages.append({
                            "day": start.strftime('%Y-%m-%d'),
                            "sleeping_heart_rate": round(avg_hr, 1)
                        })
                sleeping_hr_metrics = session_averages
                if session_averages:
                    sleeping_hr_avg = sum(s['sleeping_heart_rate'] for s in session_averages) / len(session_averages)
                    sleeping_hr_metrics = add_polynomial_trend(sleeping_hr_metrics, 'sleeping_heart_rate')

            summary = {
                "hr_metrics": hr_metrics,
                "sleeping_hr_metrics": sleeping_hr_metrics,
                "metrics": {
                    "hr_avg": {
                        "value": hr_df['heart_rate'].mean() if not hr_df.empty else None,
                        "trend": calc_trend(hr_df['heart_rate'].mean(), prev_hr_df['heart_rate'].mean()) if not hr_df.empty and not prev_hr_df.empty else 0
                    },
                    "hr_sleeping": {
                        "value": sleeping_hr_avg,
                        "trend": 0 # Trend calculation for sleeping HR would require previous period sleep data
                    },
                    "hr_min": {
                        "value": hr_df['heart_rate'].min() if not hr_df.empty else None,
                        "trend": calc_trend(hr_df['heart_rate'].min(), prev_hr_df['heart_rate'].min()) if not hr_df.empty and not prev_hr_df.empty else 0
                    },
                    "hr_max": {
                        "value": hr_df['heart_rate'].max() if not hr_df.empty else None,
                        "trend": calc_trend(hr_df['heart_rate'].max(), prev_hr_df['heart_rate'].max()) if not hr_df.empty and not prev_hr_df.empty else 0
                    },
                    "hrv": {
                        "value": vitality_df['shrv_value'].mean() if not vitality_df.empty else None,
                        "trend": calc_trend(vitality_df['shrv_value'].mean(), prev_vitality_df['shrv_value'].mean()) if not vitality_df.empty and not prev_vitality_df.empty else 0
                    }
                }
            }
            return summary
        except Exception as e:
            print(f"Heart rate aggregation error: {e}")
            return summary

    def aggregate_sleep_data(self, days: int = 30) -> Dict[str, Any]:
        """Aggregates multiple data sources for advanced sleep analysis."""
        summary = {}
        try:
            # Helper to load data for range
            def safe_fetch_range(filename, start_days, end_days):
                try:
                    df = self.load_csv(filename)
                    time_col = next((c for c in ['create_time', 'start_time', 'time'] if c in df.columns), None)
                    if not time_col: return df
                    df[time_col] = pd.to_datetime(df[time_col])
                    now = pd.Timestamp.now()
                    cutoff_start = now - pd.Timedelta(days=start_days)
                    cutoff_end = now - pd.Timedelta(days=end_days)
                    return df[(df[time_col] >= cutoff_start) & (df[time_col] < cutoff_end)]
                except:
                    return pd.DataFrame()

            # Fetch current and previous periods
            sleep_df = safe_fetch_range("sleep.csv", days, 0)
            prev_sleep_df = safe_fetch_range("sleep.csv", days * 2, days)
            
            hr_df = safe_fetch_range("heart_rate.csv", days, 0)
            prev_hr_df = safe_fetch_range("heart_rate.csv", days * 2, days)
            
            spo2_df = safe_fetch_range("oxygen_saturation.csv", days, 0)
            prev_spo2_df = safe_fetch_range("oxygen_saturation.csv", days * 2, days)
            
            vitality_df = safe_fetch_range("vitality_score.csv", days, 0)
            prev_vitality_df = safe_fetch_range("vitality_score.csv", days * 2, days)

            stages_df = safe_fetch_range("sleep_stage.csv", days, 0)

            # Create a summary for AI
            sleep_metrics = []
            if not sleep_df.empty:
                df_copy = sleep_df[['start_time', 'sleep_score', 'efficiency', 'sleep_duration', 'physical_recovery', 'mental_recovery']].tail(days).copy()
                df_copy['start_time'] = pd.to_datetime(df_copy['start_time']).dt.strftime('%Y-%m-%d')
                sleep_metrics = df_copy.to_dict(orient='records')

            # Aggregate sleep stages
            stages_summary = {}
            if not stages_df.empty and 'start_time' in stages_df.columns and 'end_time' in stages_df.columns:
                try:
                    stages_df['duration_min'] = (pd.to_datetime(stages_df['end_time']) - pd.to_datetime(stages_df['start_time'])).dt.total_seconds() / 60
                    stages_summary = stages_df.groupby('stage')['duration_min'].sum().round(1).to_dict()
                except: pass

            def calc_trend(curr_val, prev_val):
                if not curr_val or not prev_val or prev_val == 0: return 0
                return ((curr_val - prev_val) / prev_val) * 100

            summary = {
                "sleep_metrics": sleep_metrics,
                "stages_summary": stages_summary,
                "metrics": {
                    "sleep_duration": {
                        "value": sleep_df['sleep_duration'].mean() if not sleep_df.empty else None,
                        "trend": calc_trend(sleep_df['sleep_duration'].mean(), prev_sleep_df['sleep_duration'].mean()) if not sleep_df.empty and not prev_sleep_df.empty else 0
                    },
                    "efficiency": {
                        "value": sleep_df['efficiency'].mean() if not sleep_df.empty else None,
                        "trend": calc_trend(sleep_df['efficiency'].mean(), prev_sleep_df['efficiency'].mean()) if not sleep_df.empty and not prev_sleep_df.empty else 0
                    },
                    "hr": {
                        "value": hr_df['heart_rate'].mean() if not hr_df.empty else None,
                        "min": hr_df['heart_rate'].min() if not hr_df.empty else None,
                        "trend": calc_trend(hr_df['heart_rate'].mean(), prev_hr_df['heart_rate'].mean()) if not hr_df.empty and not prev_hr_df.empty else 0
                    },
                    "spo2": {
                        "value": spo2_df['spo2'].mean() if not spo2_df.empty else None,
                        "min": spo2_df['spo2'].min() if not spo2_df.empty else None,
                        "trend": calc_trend(spo2_df['spo2'].mean(), prev_spo2_df['spo2'].mean()) if not spo2_df.empty and not prev_spo2_df.empty else 0
                    },
                    "hrv": {
                        "value": vitality_df['shrv_value'].mean() if not vitality_df.empty else None,
                        "trend": calc_trend(vitality_df['shrv_value'].mean(), prev_vitality_df['shrv_value'].mean()) if not vitality_df.empty and not prev_vitality_df.empty else 0
                    }
                }
            }
            return summary
        except Exception as e:
            print(f"Aggregation error: {e}")
            return summary
