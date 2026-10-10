"""
Prediction Schemas for Invisible Queue WMSB v1
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CrowdReportInput(BaseModel):
    crowd_level: str = Field(..., description="'low', 'moderate', 'high', 'very_high'")
    estimated_wait_min: Optional[int] = Field(None, description="Optional reported wait minutes")
    age_in_minutes: float = Field(..., description="Minutes elapsed since report was submitted")

class HistoricalSlotMetric(BaseModel):
    avg_wait_min: float
    avg_crowd_level: float
    sample_count: int

class PredictionRequest(BaseModel):
    service_id: str
    day_of_week: int = Field(..., ge=0, le=6, description="0=Sunday, 6=Saturday")
    hour_of_day: int = Field(..., ge=0, le=23, description="0-23 hour")
    recent_reports: List[CrowdReportInput] = []
    historical_metric: Optional[HistoricalSlotMetric] = None
    official_queue_wait_min: Optional[int] = None

class ConfidenceBreakdown(BaseModel):
    score: int
    label: str  # 'low', 'medium', 'high'
    factors: Dict[str, Any]
    explanation: str

class WaitRange(BaseModel):
    low_min: int
    high_min: int

class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_version: str = "WMSB-1.0.0"
    crowd_level: str
    estimated_wait_min: int
    wait_range: WaitRange
    confidence: ConfidenceBreakdown
    data_sources: Dict[str, Any]
    components: Dict[str, Any]
