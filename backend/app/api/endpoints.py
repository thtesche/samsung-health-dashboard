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
