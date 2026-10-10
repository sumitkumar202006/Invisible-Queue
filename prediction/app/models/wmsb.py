"""
Weighted Multi-Source Baseline (WMSB v1) Model
Transparent, deterministic, explainable crowd waiting-time prediction.
"""
import math
from typing import List, Optional, Tuple, Dict, Any
from app.schemas import (
    CrowdReportInput,
    HistoricalSlotMetric,
    PredictionResponse,
    ConfidenceBreakdown,
    WaitRange
)

# Standard default wait time mappings for crowd tiers (in minutes)
CROWD_LEVEL_DEFAULTS = {
    "low": 15,
    "moderate": 45,
    "high": 90,
    "very_high": 150
}

CROWD_LEVEL_NUMERIC = {
    "low": 1.0,
    "moderate": 2.0,
    "high": 3.0,
    "very_high": 4.0
}

NUMERIC_TO_CROWD = [
    (1.5, "low"),
    (2.5, "moderate"),
    (3.5, "high"),
    (99.0, "very_high")
]

class WMSBModel:
    VERSION = "WMSB-1.0.0"

    @classmethod
    def calculate_report_weights(
        cls, reports: List[CrowdReportInput], decay_lambda: float = 0.02
    ) -> List[float]:
        """Calculates exponential recency weight for each report: w = exp(-lambda * age_min)"""
        weights = []
        for r in reports:
            # Clamp age to positive values
            age = max(0.0, r.age_in_minutes)
            w = math.exp(-decay_lambda * age)
            weights.append(w)
        return weights

    @classmethod
    def compute_confidence(
        cls,
        reports: List[CrowdReportInput],
        has_history: bool,
        has_official: bool
    ) -> Tuple[int, str, Dict[str, Any], str]:
        """
        Computes 0-100 confidence score breakdown:
        - Volume (0-35)
        - Recency (0-25)
        - Agreement (0-20)
        - Historical baseline (0-15)
        - Official data (0-5)
        """
        # 1. Report volume (caps at 7 reports)
        n_reports = len(reports)
        vol_score = min(35, n_reports * 5)

        # 2. Recency score (0-25)
        if n_reports > 0:
            avg_age = sum(r.age_in_minutes for r in reports) / n_reports
            # Linear decay from 25 at 5 min to 0 at 120 min
            recency_score = max(0, min(25, int(25 * (1.0 - (avg_age / 120.0)))))
        else:
            recency_score = 0

        # 3. Report agreement (0-20)
        if n_reports >= 2:
            numerics = [CROWD_LEVEL_NUMERIC.get(r.crowd_level.lower(), 2.0) for r in reports]
            mean = sum(numerics) / n_reports
            variance = sum((x - mean) ** 2 for x in numerics) / n_reports
            std_dev = math.sqrt(variance)
            # Low std dev (< 0.5) gives full 20 pts; std dev >= 1.5 gives 5 pts
            if std_dev <= 0.4:
                agreement_score = 20
            elif std_dev <= 0.8:
                agreement_score = 15
            elif std_dev <= 1.2:
                agreement_score = 10
            else:
                agreement_score = 5
        elif n_reports == 1:
            agreement_score = 10  # Single report has moderate initial trust
        else:
            agreement_score = 0

        # 4. Historical availability (0-15)
        history_score = 15 if has_history else 0

        # 5. Official data availability (0-5)
        official_score = 5 if has_official else 0

        total_score = min(100, vol_score + recency_score + agreement_score + history_score + official_score)

        if total_score >= 67:
            label = "high"
        elif total_score >= 34:
            label = "medium"
        else:
            label = "low"

        factors = {
            "volume_score": vol_score,
            "recency_score": recency_score,
            "agreement_score": agreement_score,
            "history_score": history_score,
            "official_score": official_score
        }

        explanation_parts = []
        if n_reports > 0:
            explanation_parts.append(f"{n_reports} recent citizen report(s)")
        if has_history:
            explanation_parts.append("historical slot metrics")
        if has_official:
            explanation_parts.append("official queue telemetry")

        if not explanation_parts:
            explanation = "Sparse data: default baseline estimation"
        else:
            explanation = f"Calculated from {' and '.join(explanation_parts)}"

        return total_score, label, factors, explanation

    @classmethod
    def predict(
        cls,
        service_id: str,
        reports: List[CrowdReportInput],
        historical: Optional[HistoricalSlotMetric],
        official_wait: Optional[int] = None
    ) -> PredictionResponse:
        n_reports = len(reports)
        has_history = historical is not None and historical.sample_count > 0
        has_official = official_wait is not None

        # 1. Calculate weighted report wait time
        weighted_report_wait = 0.0
        weighted_report_crowd_numeric = 0.0
        sum_report_weights = 0.0

        if n_reports > 0:
            weights = cls.calculate_report_weights(reports)
            for r, w in zip(reports, weights):
                wait_val = r.estimated_wait_min if r.estimated_wait_min is not None else CROWD_LEVEL_DEFAULTS.get(r.crowd_level.lower(), 45)
                numeric_val = CROWD_LEVEL_NUMERIC.get(r.crowd_level.lower(), 2.0)
                weighted_report_wait += wait_val * w
                weighted_report_crowd_numeric += numeric_val * w
                sum_report_weights += w

            if sum_report_weights > 0:
                report_avg_wait = weighted_report_wait / sum_report_weights
                report_avg_numeric = weighted_report_crowd_numeric / sum_report_weights
            else:
                report_avg_wait = 45.0
                report_avg_numeric = 2.0
        else:
            report_avg_wait = None
            report_avg_numeric = None

        # 2. Determine source weights
        if has_official:
            w_official = 0.5
            w_reports = 0.3 if report_avg_wait is not None else 0.0
            w_history = 0.2 if has_history else 0.0
            # Normalize remaining
            total_w = w_official + w_reports + w_history
            w_official /= total_w
            w_reports /= total_w
            w_history /= total_w
        elif report_avg_wait is not None and has_history:
            w_reports = 0.65
            w_history = 0.35
            w_official = 0.0
        elif report_avg_wait is not None:
            w_reports = 1.0
            w_history = 0.0
            w_official = 0.0
        elif has_history:
            w_reports = 0.0
            w_history = 1.0
            w_official = 0.0
        else:
            # Fallback baseline
            w_reports = 0.0
            w_history = 0.0
            w_official = 0.0

        # 3. Compute blended estimated wait & crowd level
        if w_reports == 0.0 and w_history == 0.0 and w_official == 0.0:
            final_wait_min = 30
            final_crowd_numeric = 1.5
        else:
            final_wait_min = (
                (w_official * (official_wait or 0)) +
                (w_reports * (report_avg_wait or 0)) +
                (w_history * (historical.avg_wait_min if historical else 0))
            )
            hist_numeric = historical.avg_crowd_level if historical else 2.0
            rep_numeric = report_avg_numeric if report_avg_numeric is not None else 2.0
            final_crowd_numeric = (w_reports * rep_numeric) + (w_history * hist_numeric)

        # Map crowd numeric back to label
        crowd_label = "moderate"
        for upper_bound, tier in NUMERIC_TO_CROWD:
            if final_crowd_numeric <= upper_bound:
                crowd_label = tier
                break

        final_wait_int = max(5, int(round(final_wait_min)))

        # 4. Confidence calculation
        score, conf_label, factors, explanation = cls.compute_confidence(
            reports=reports,
            has_history=has_history,
            has_official=has_official
        )

        # 5. Uncertainty range
        # Lower confidence yields wider spread (+/- 40%), high confidence yields tighter (+/- 15%)
        uncertainty_rate = 0.15 + (0.35 * (1.0 - (score / 100.0)))
        low_bound = max(5, int(round(final_wait_int * (1.0 - uncertainty_rate))))
        high_bound = int(round(final_wait_int * (1.0 + uncertainty_rate)))

        return PredictionResponse(
            model_version=cls.VERSION,
            crowd_level=crowd_label,
            estimated_wait_min=final_wait_int,
            wait_range=WaitRange(low_min=low_bound, high_min=high_bound),
            confidence=ConfidenceBreakdown(
                score=score,
                label=conf_label,
                factors=factors,
                explanation=explanation
            ),
            data_sources={
                "recent_reports_count": n_reports,
                "has_historical": has_history,
                "has_official_data": has_official,
                "weights_applied": {
                    "reports": round(w_reports, 2),
                    "historical": round(w_history, 2),
                    "official": round(w_official, 2)
                }
            },
            components={
                "report_avg_wait_min": round(report_avg_wait, 1) if report_avg_wait else None,
                "historical_avg_wait_min": round(historical.avg_wait_min, 1) if has_history else None,
                "uncertainty_rate": round(uncertainty_rate, 2)
            }
        )
