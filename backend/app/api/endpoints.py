from fastapi import APIRouter, HTTPException, Body
from ..services.data_loader import DataLoader
from ..services.ai_service import ai_service
import os

router = APIRouter()

# Initialize DataLoader with the path to the cleaned data
# Assuming the 'cleaned' directory is at the project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_DIR = os.path.join(BASE_DIR, "cleaned")
data_loader = DataLoader(DATA_DIR)

@router.get("/data/files")
async def list_files():
    """List all available data files."""
    try:
        files = data_loader.get_all_data_files()
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data/{filename}")
async def get_data(filename: str, limit: int = 100):
    """Get raw data from a specific file."""
    try:
        df = data_loader.load_csv(filename)
        # Handle NaN values for JSON serialization
        data = df.head(limit).fillna("").to_dict(orient="records")
        return {"filename": filename, "total_rows": len(df), "data": data}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data/{filename}/summary")
async def get_data_summary(filename: str):
    """Get statistical summary of a file."""
    try:
        summary = data_loader.get_summary(filename)
        return {"filename": filename, "summary": summary}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/{filename}")
async def analyze_file(filename: str):
    """Generate AI insights for a specific file."""
    try:
        # Load a chunk of data for analysis (e.g. last 30 days or first 100 rows)
        # For simplicity, loading first 100 rows or using summary
        df = data_loader.load_csv(filename)
        data_subset = df.head(100).to_dict(orient="records")
        
        insight = ai_service.analyze_data(filename, data_subset)
        return {"filename": filename, "insight": insight}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/analyze/sleep/advanced")
async def analyze_sleep_advanced(period: str = Body(..., embed=True)):
    """Generate advanced sleep insights for a week or month."""
    try:
        days = 7 if period == "week" else 30
        data = data_loader.aggregate_sleep_data(days)
        
        if not data:
            raise HTTPException(status_code=404, detail="No sleep data found for analysis")
            
        insight = ai_service.analyze_sleep_advanced(data, period)
        return {"period": period, "insight": insight, "data_used": data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/analyze/heart_rate/advanced")
async def analyze_heart_rate_advanced(period: str = Body(..., embed=True)):
    """Generate advanced heart rate insights for a week or month."""
    try:
        days = 7 if period == "week" else 30
        data = data_loader.aggregate_heart_rate_data(days)
        
        if not data or not data.get('metrics'):
            raise HTTPException(status_code=404, detail="No heart rate data found for analysis")
            
        insight = ai_service.analyze_heart_rate_advanced(data, period)
        return {"period": period, "insight": insight, "data_used": data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
