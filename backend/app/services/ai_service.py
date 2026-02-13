import requests
import pandas as pd
import json
from typing import Dict, Any

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "deepseek-r1:14b" # mistral, llama3, qwq user can change this

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

    def analyze_data(self, filename: str, data: list, stream: bool = False):
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
            Format your response in Markdown.
            
            Data Summary:
            {data_summary}
            
            Analysis:
            """
            
            payload = {
                "model": MODEL_NAME,
                "prompt": prompt,
            }

            if stream:
                payload["stream"] = True
                response = requests.post(OLLAMA_URL, json=payload, stream=True, timeout=300)
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        decoded_line = line.decode('utf-8')
                        try:
                            json_line = json.loads(decoded_line)
                            if 'response' in json_line:
                                yield json_line['response']
                        except:
                            pass
            else:
                response = requests.post(OLLAMA_URL, json=payload, timeout=300)
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

    def analyze_heart_rate_advanced(self, data: Dict[str, Any], period_name: str, stream: bool = False):
        """
        Performs advanced analysis on heart rate data including resting HR and HRV.
        """
        try:
            period_map = {"week": "7 days", "month": "30 days", "90d": "90 days", "180d": "180 days"}
            display_period = period_map.get(period_name, period_name)
            metrics = data.get('metrics', {})
            hr_avg = metrics.get('hr_avg', {})
            hr_min = metrics.get('hr_min', {})
            hr_max = metrics.get('hr_max', {})
            hrv = metrics.get('hrv', {})

            # Get the date range for better context
            start_date = data.get('hr_metrics', [{}])[0].get('day', 'unknown') if data.get('hr_metrics') else 'unknown'
            end_date = data.get('hr_metrics', [{}])[-1].get('day', 'unknown') if data.get('hr_metrics') else 'unknown'

            # Construct a detailed prompt
            prompt = f"""
            [SYSTEM: CRITICAL HEALTH REPORT DURATION UPDATE]
            THIS IS A {display_period.upper()} ANALYSIS REPORT. 
            DATE RANGE: From {start_date} to {end_date}.
            
            You are a specialized cardiologist and health data analyst. Analyze the following Samsung Health heart rate data for this {display_period} report.
            
            CRITICAL INSTRUCTION: You must explicitly acknowledge that this report covers the last {display_period} (from {start_date} to {end_date}). 
            Do NOT refer to this as a 30-day or week-long report.
            
            Metrics summary for the {display_period} period:
            - Average Heart Rate: {hr_avg.get('value', 0):.1f} bpm (Trend over previous period: {hr_avg.get('trend', 0):+.1f}%)
            - Minimum Heart Rate: {hr_min.get('value', 0):.1f} bpm (Trend over previous period: {hr_min.get('trend', 0):+.1f}%)
            - Maximum Heart Rate: {hr_max.get('value', 0):.1f} bpm (Trend over previous period: {hr_max.get('trend', 0):+.1f}%)
            - Average HRV (Heart Rate Variability): {hrv.get('value', 0):.1f} ms (Trend over previous period: {hrv.get('trend', 0):+.1f}%)
            
            Daily Average Trend (Last 30 entries for context):
            {json.dumps(data.get('hr_metrics', [])[-30:])}
            
            Please provide:
            1. An assessment of overall cardiovascular health based on these metrics for this specific {display_period} period.
            2. Interpretation of resting heart rate (minimum HR) and regular average over the {display_period}.
            3. Significance of the HRV trend for long-term recovery.
            4. Potential red flags or positive signs in the trends over these {display_period}.
            5. Personalized lifestyle recommendations to optimize heart health.
            
            Keep it professional, encouraging, and scientifically grounded. Use German if the user's data or language suggests it, but standard English is also acceptable unless specified otherwise.
            Format your response in Markdown.
            """
            
            print(f"DEBUG: Sending prompt for {display_period} to Ollama")
            
            payload = {
                "model": MODEL_NAME,
                "prompt": prompt,
            }

            if stream:
                payload["stream"] = True
                response = requests.post(OLLAMA_URL, json=payload, stream=True, timeout=600)
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        decoded_line = line.decode('utf-8')
                        try:
                            json_line = json.loads(decoded_line)
                            if 'response' in json_line:
                                yield json_line['response']
                        except:
                            pass
            else:
                response = requests.post(OLLAMA_URL, json=payload, timeout=600)
                response.raise_for_status()
                result = response.json()
                return result.get('response', 'No response from AI.')

        except Exception as e:
            return f"Error in advanced heart rate analysis: {str(e)}"

    def analyze_sleep_advanced(self, data: Dict[str, Any], period_name: str, stream: bool = False):
        """
        Performs advanced analysis on sleep data including heart rate, SpO2 and HRV.
        """
        try:
            period_map = {"week": "7 days", "month": "30 days", "90d": "90 days", "180d": "180 days"}
            display_period = period_map.get(period_name, period_name)
            metrics = data.get('metrics', {})
            hr = metrics.get('hr', {})
            spo2 = metrics.get('spo2', {})
            hrv = metrics.get('hrv', {})
            duration = metrics.get('sleep_duration', {})

            # Get the date range for better context
            start_date = data.get('sleep_metrics', [{}])[0].get('day', 'unknown') if data.get('sleep_metrics') else 'unknown'
            end_date = data.get('sleep_metrics', [{}])[-1].get('day', 'unknown') if data.get('sleep_metrics') else 'unknown'

            # Construct a detailed prompt
            prompt = f"""
            [SYSTEM: CRITICAL HEALTH REPORT DURATION UPDATE]
            THIS IS A {display_period.upper()} SLEEP ANALYSIS REPORT. 
            DATE RANGE: From {start_date} to {end_date}.
            
            You are a specialized sleep doctor and data analyst. Analyze the following Samsung Health sleep data for this {display_period} report.
            
            CRITICAL INSTRUCTION: You must explicitly acknowledge that this report covers the last {display_period} (from {start_date} to {end_date}).
            Do NOT refer to this as a 30-day or week-long report.
            
            Metrics summary for the {display_period} period:
            - Avg Sleep duration: {duration.get('value', 0) / 60 if duration.get('value') else 0:.1f} hours
            - Sleep Phases (Total min): {json.dumps(data.get('stages_summary', {}))}
            - Avg Heart Rate: {hr.get('value', 0) if hr.get('value') else 0:.1f} bpm (Min: {hr.get('min', 0) if hr.get('min') else 0:.1f})
            - Avg SpO2 (Oxygen): {spo2.get('value', 0) if spo2.get('value') else 0:.1f}% (Min: {spo2.get('min', 0) if spo2.get('min') else 0:.1f}%)
            - Avg HRV (Recovery): {hrv.get('value', 0) if hrv.get('value') else 0:.1f} ms
            
            Sleep Trend (Last 30 entries for context):
            {json.dumps(data.get('sleep_metrics', [])[-30:])}
            
            Please provide:
            1. A summary of sleep quality and consistency over the {display_period}.
            2. Detailed evaluation of sleep stage distribution (REM, Deep, Light) for this period.
            3. Relationship between heart rate/HRV and sleep recovery trends.
            4. Evaluation of oxygen saturation (looking for potential issues).
            5. Concrete recommendations for improvement based on these {display_period}.
            
            Keep it professional and insightful.
            Format your response in Markdown.
            """
            
            payload = {
                "model": MODEL_NAME,
                "prompt": prompt,
            }

            if stream:
                payload["stream"] = True
                response = requests.post(OLLAMA_URL, json=payload, stream=True, timeout=600)
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        decoded_line = line.decode('utf-8')
                        try:
                            json_line = json.loads(decoded_line)
                            if 'response' in json_line:
                                yield json_line['response']
                        except:
                            pass
            else:
                response = requests.post(OLLAMA_URL, json=payload, timeout=600)
                response.raise_for_status()
                result = response.json()
                return result.get('response', 'No response from AI.')

        except Exception as e:
            return f"Error in advanced sleep analysis: {str(e)}"

ai_service = AIService()
