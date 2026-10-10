"""
Invisible Queue — Prediction Service (FastAPI)
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import PredictionRequest, PredictionResponse
from app.models.wmsb import WMSBModel

app = FastAPI(
    title="Invisible Queue Prediction Service",
    description="Deterministic and transparent waiting-time & crowd-prediction engine (WMSB v1)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "invisible-queue-prediction",
        "model_version": WMSBModel.VERSION
    }

@app.post("/predict", response_model=PredictionResponse)
def generate_prediction(req: PredictionRequest):
    try:
        prediction = WMSBModel.predict(
            service_id=req.service_id,
            reports=req.recent_reports,
            historical=req.historical_metric,
            official_wait=req.official_queue_wait_min
        )
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
