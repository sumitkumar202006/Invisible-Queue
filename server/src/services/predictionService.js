/**
 * Prediction Service Adapter (Node.js)
 * Calls the Python FastAPI WMSB microservice, with an embedded
 * deterministic mathematical fallback if the microservice is offline.
 */

const PREDICTION_SERVICE_URL = process.env.PREDICTION_SERVICE_URL || 'http://localhost:8000';

const CROWD_LEVEL_DEFAULTS = {
  low: 15,
  moderate: 45,
  high: 90,
  very_high: 150
};

const CROWD_LEVEL_NUMERIC = {
  low: 1.0,
  moderate: 2.0,
  high: 3.0,
  very_high: 4.0
};

const NUMERIC_TO_CROWD = [
  { threshold: 1.5, label: 'low' },
  { threshold: 2.5, label: 'moderate' },
  { threshold: 3.5, label: 'high' },
  { threshold: 99.0, label: 'very_high' }
];

export class PredictionService {
  /**
   * Dispatches prediction calculation to Python FastAPI, falling back to embedded WMSB v1
   */
  static async getPrediction({ serviceId, dayOfWeek, hourOfDay, recentReports, historicalMetric, officialWaitMin }) {
    // 1. Prepare reports payload with age in minutes
    const now = Date.now();
    const reportsPayload = (recentReports || []).map(r => {
      const ageMin = Math.max(0, (now - new Date(r.created_at).getTime()) / (60 * 1000));
      return {
        crowd_level: r.crowd_level,
        estimated_wait_min: r.estimated_wait_min || null,
        age_in_minutes: parseFloat(ageMin.toFixed(1))
      };
    });

    const historicalPayload = historicalMetric ? {
      avg_wait_min: parseFloat(historicalMetric.avg_wait_min),
      avg_crowd_level: parseFloat(historicalMetric.avg_crowd_level),
      sample_count: parseInt(historicalMetric.sample_count, 10)
    } : null;

    const requestBody = {
      service_id: serviceId,
      day_of_week: dayOfWeek,
      hour_of_day: hourOfDay,
      recent_reports: reportsPayload,
      historical_metric: historicalPayload,
      official_queue_wait_min: officialWaitMin || null
    };

    // 2. Try HTTP call to Python microservice
    try {
      const response = await fetch(`${PREDICTION_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(1500) // 1.5s timeout for low-latency responsiveness
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      // Python service offline or timeout — smoothly execute embedded WMSB v1 calculation
      // console.warn(`[PredictionService] Python service unavailable (${err.message}). Using embedded WMSB v1 engine.`);
    }

    // 3. Embedded WMSB v1 Fallback Engine (Exact parity with Python model)
    return this.calculateEmbeddedWMSB({
      serviceId,
      reports: reportsPayload,
      historical: historicalPayload,
      officialWait: officialWaitMin
    });
  }

  static calculateEmbeddedWMSB({ serviceId, reports, historical, officialWait }) {
    const nReports = reports.length;
    const hasHistory = !!historical && historical.sample_count > 0;
    const hasOfficial = officialWait !== undefined && officialWait !== null;

    // Recency weighting: w = exp(-0.02 * age)
    let weightedReportWait = 0.0;
    let weightedReportCrowdNumeric = 0.0;
    let sumReportWeights = 0.0;

    if (nReports > 0) {
      for (const r of reports) {
        const w = Math.exp(-0.02 * Math.max(0, r.age_in_minutes));
        const wait = r.estimated_wait_min || CROWD_LEVEL_DEFAULTS[r.crowd_level.toLowerCase()] || 45;
        const numeric = CROWD_LEVEL_NUMERIC[r.crowd_level.toLowerCase()] || 2.0;

        weightedReportWait += wait * w;
        weightedReportCrowdNumeric += numeric * w;
        sumReportWeights += w;
      }
    }

    const reportAvgWait = sumReportWeights > 0 ? weightedReportWait / sumReportWeights : null;
    const reportAvgNumeric = sumReportWeights > 0 ? weightedReportCrowdNumeric / sumReportWeights : null;

    // Determine signal blend weights
    let wOfficial = 0.0;
    let wReports = 0.0;
    let wHistory = 0.0;

    if (hasOfficial) {
      wOfficial = 0.5;
      wReports = reportAvgWait !== null ? 0.3 : 0.0;
      wHistory = hasHistory ? 0.2 : 0.0;
      const total = wOfficial + wReports + wHistory;
      wOfficial /= total;
      wReports /= total;
      wHistory /= total;
    } else if (reportAvgWait !== null && hasHistory) {
      wReports = 0.65;
      wHistory = 0.35;
    } else if (reportAvgWait !== null) {
      wReports = 1.0;
    } else if (hasHistory) {
      wHistory = 1.0;
    }

    // Estimate blended wait
    let finalWaitMin = 30;
    let finalCrowdNumeric = 2.0;

    if (wReports > 0 || wHistory > 0 || wOfficial > 0) {
      finalWaitMin = (
        (wOfficial * (officialWait || 0)) +
        (wReports * (reportAvgWait || 0)) +
        (wHistory * (historical ? historical.avg_wait_min : 0))
      );
      const histNumeric = historical ? historical.avg_crowd_level : 2.0;
      const repNumeric = reportAvgNumeric !== null ? reportAvgNumeric : 2.0;
      finalCrowdNumeric = (wReports * repNumeric) + (wHistory * histNumeric);
    }

    let crowdLabel = 'moderate';
    for (const tier of NUMERIC_TO_CROWD) {
      if (finalCrowdNumeric <= tier.threshold) {
        crowdLabel = tier.label;
        break;
      }
    }

    const finalWaitInt = Math.max(5, Math.round(finalWaitMin));

    // Confidence breakdown (0-100)
    const volScore = Math.min(35, nReports * 5);
    let recencyScore = 0;
    if (nReports > 0) {
      const avgAge = reports.reduce((acc, cur) => acc + cur.age_in_minutes, 0) / nReports;
      recencyScore = Math.max(0, Math.min(25, Math.round(25 * (1.0 - (avgAge / 120.0)))));
    }

    let agreementScore = 0;
    if (nReports >= 2) {
      const numerics = reports.map(r => CROWD_LEVEL_NUMERIC[r.crowd_level.toLowerCase()] || 2.0);
      const mean = numerics.reduce((a, b) => a + b, 0) / nReports;
      const variance = numerics.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nReports;
      const stdDev = Math.sqrt(variance);
      if (stdDev <= 0.4) agreementScore = 20;
      else if (stdDev <= 0.8) agreementScore = 15;
      else if (stdDev <= 1.2) agreementScore = 10;
      else agreementScore = 5;
    } else if (nReports === 1) {
      agreementScore = 10;
    }

    const historyScore = hasHistory ? 15 : 0;
    const officialScore = hasOfficial ? 5 : 0;
    const confidenceScore = Math.min(100, volScore + recencyScore + agreementScore + historyScore + officialScore);

    let confidenceLabel = 'low';
    if (confidenceScore >= 67) confidenceLabel = 'high';
    else if (confidenceScore >= 34) confidenceLabel = 'medium';

    // Uncertainty range
    const uncertaintyRate = 0.15 + (0.35 * (1.0 - (confidenceScore / 100.0)));
    const lowBound = Math.max(5, Math.round(finalWaitInt * (1.0 - uncertaintyRate)));
    const highBound = Math.round(finalWaitInt * (1.0 + uncertaintyRate));

    return {
      model_version: 'WMSB-1.0.0-embedded',
      crowd_level: crowdLabel,
      estimated_wait_min: finalWaitInt,
      wait_range: { low_min: lowBound, high_min: highBound },
      confidence: {
        score: confidenceScore,
        label: confidenceLabel,
        factors: {
          volume_score: volScore,
          recency_score: recencyScore,
          agreement_score: agreementScore,
          history_score: historyScore,
          official_score: officialScore
        },
        explanation: nReports > 0
          ? `Calculated from ${nReports} recent citizen report(s) and historical patterns`
          : `Prediction based on historical day/hour patterns`
      },
      data_sources: {
        recent_reports_count: nReports,
        has_historical: hasHistory,
        has_official_data: hasOfficial,
        weights_applied: {
          reports: Number(wReports.toFixed(2)),
          historical: Number(wHistory.toFixed(2)),
          official: Number(wOfficial.toFixed(2))
        }
      },
      components: {
        report_avg_wait_min: reportAvgWait ? Math.round(reportAvgWait) : null,
        historical_avg_wait_min: historical ? Math.round(historical.avg_wait_min) : null,
        uncertainty_rate: Number(uncertaintyRate.toFixed(2))
      }
    };
  }
}
