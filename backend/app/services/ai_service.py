import requests
import pandas as pd
import json
from typing import Dict, Any

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral" # Or llama3, user can change this

class AIService:
    def __init__(self):
        pass

    def _get_statistical_summary(self, df: pd.DataFrame) -> str:
        """Generates a text summary based on statistics."""
        desc = df.describe()
        summary = "Statistical Analysis (AI Offline):\n"
        
        if 'count' in desc.index:
            summary += f"- Data Points: {int(desc.iloc[0,0])}\n"
        
        # Numeric columns analysis
        for col in desc.columns:
            try:
                mean_val = desc.at['mean', col]
                max_val = desc.at['max', col]
                min_val = desc.at['min', col]
                summary += f"- {col}: Avg {mean_val:.2f}, Max {max_val:.2f}, Min {min_val:.2f}\n"
            except:
                pass
                
        return summary

    def analyze_data(self, filename: str, data: list) -> str:
        """
        Analyzes the provided data snippet using Local AI or Statistics.
        """
        # Convert list of dicts to string summary for the prompt
        df = pd.DataFrame(data)
        
        # Check if we should try Ollama
        try:
            # Construct Prompt
            data_summary = df.describe().to_string()
            prompt = f"""
            You are a health data analyst. Analyze the following Samsung Health data summary for '{filename}'.
            Identify trends, anomalies, or interesting patterns. Keep it concise (3-4 bullet points).
            
            Data Summary:
            {data_summary}
            
            Analysis:
            """
            
            payload = {
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False
            }
            
            response = requests.post(OLLAMA_URL, json=payload, timeout=5)
            response.raise_for_status()
            result = response.json()
            return result.get('response', 'No response from AI.')

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                return f"Note: Local AI model '{MODEL_NAME}' not found. Falling back to statistical analysis.\n\n" + self._get_statistical_summary(df)
            return self._get_statistical_summary(df)
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            return self._get_statistical_summary(df)
        except Exception as e:
            return f"Error analyzing data: {str(e)}"

    def analyze_sleep_advanced(self, data: Dict[str, Any], period_name: str) -> str:
        """
        Performs advanced analysis on sleep data including heart rate, SpO2 and HRV.
        """
        try:
            # Construct a detailed prompt
            prompt = f"""
            You are a specialized sleep doctor and data analyst. Analyze the following Samsung Health sleep data for the last {period_name}.
            
            Metrics:
            - Sleep Phases: {json.dumps(data.get('stages_summary', {}))}
            - Avg Heart Rate: {data.get('hr_avg', 'N/A'):.1f} bpm (Min: {data.get('hr_min', 'N/A'):.1f})
            - Avg SpO2 (Oxygen): {data.get('spo2_avg', 'N/A'):.1f}% (Min: {data.get('spo2_min', 'N/A'):.1f}%)
            - Avg HRV (Recovery): {data.get('hrv_avg', 'N/A'):.1f} ms
            
            Sleep Trend (Last Entries):
            {json.dumps(data.get('sleep_metrics', [])[-7:])}
            
            Please provide:
            1. A summary of sleep quality.
            2. Relationship between heart rate/HRV and sleep recovery.
            3. Evaluation of oxygen saturation (looking for potential issues).
            4. Concrete recommendations for improvement.
            
            Keep it professional and insightful.
            """
            
            payload = {
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False
            }
            
            response = requests.post(OLLAMA_URL, json=payload, timeout=10)
            response.raise_for_status()
            result = response.json()
            return result.get('response', 'No response from AI.')

        except Exception as e:
            return f"Error in advanced sleep analysis: {str(e)}"

ai_service = AIService()
