/**
 * Report Service: Anonymous submission, abuse mitigation, outlier filtering & impact feedback
 */
import db from '../db/index.js';
import { PredictionService } from './predictionService.js';

// Ephemeral submission tracking for rate limiting (prevents duplicate spam within 10 minutes)
const recentSubmissions = new Map(); // key: `${reporterHash}_${serviceId}`, val: timestamp

export class ReportService {
  static RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

  static async submitReport({ serviceId, crowdLevel, estimatedWaitMin, reporterHash }) {
    const now = Date.now();
    const rateLimitKey = `${reporterHash || 'anon'}_${serviceId}`;

    // 1. Rate-limit check
    if (reporterHash) {
      const lastSubmission = recentSubmissions.get(rateLimitKey);
      if (lastSubmission && (now - lastSubmission) < this.RATE_LIMIT_WINDOW_MS) {
        const remainingMin = Math.ceil((this.RATE_LIMIT_WINDOW_MS - (now - lastSubmission)) / (60 * 1000));
        const error = new Error(`Rate limit reached. You can submit another report for this service in ${remainingMin} minute(s).`);
        error.statusCode = 429;
        throw error;
      }
    }

    // 2. Fetch service & existing state for impact comparison
    const service = db.getServiceById(serviceId);
    if (!service) {
      const error = new Error('Service not found');
      error.statusCode = 404;
      throw error;
    }

    const currentReports = db.getActiveReportsForService(serviceId);
    const dateNow = new Date();
    const dayOfWeek = dateNow.getDay();
    const hourOfDay = dateNow.getHours();
    const historicalMetric = db.getHistoricalMetric(serviceId, dayOfWeek, hourOfDay);

    // Calculate baseline prediction before new report
    const prePrediction = await PredictionService.getPrediction({
      serviceId,
      dayOfWeek,
      hourOfDay,
      recentReports: currentReports,
      historicalMetric
    });

    // 3. Outlier detection check (if multiple reports exist)
    let isFlagged = false;
    if (currentReports.length >= 3 && estimatedWaitMin) {
      const numericWaits = currentReports.map(r => r.estimated_wait_min).filter(Boolean);
      if (numericWaits.length >= 3) {
        const avg = numericWaits.reduce((a, b) => a + b, 0) / numericWaits.length;
        if (estimatedWaitMin > avg * 3.0 || estimatedWaitMin < avg * 0.2) {
          isFlagged = true; // Mark as outlier but still record for auditing
        }
      }
    }

    // 4. Insert report
    const newReport = db.insertCrowdReport({
      service_id: serviceId,
      crowd_level: crowdLevel.toLowerCase(),
      estimated_wait_min: estimatedWaitMin ? parseInt(estimatedWaitMin, 10) : null,
      reporter_hash: reporterHash || null,
      is_flagged: isFlagged
    });

    // Update rate limit cache
    if (reporterHash) {
      recentSubmissions.set(rateLimitKey, now);
    }

    // 5. Calculate immediate updated prediction
    const updatedReports = db.getActiveReportsForService(serviceId);
    const postPrediction = await PredictionService.getPrediction({
      serviceId,
      dayOfWeek,
      hourOfDay,
      recentReports: updatedReports,
      historicalMetric
    });

    // 6. Impact calculation
    const deltaMin = postPrediction.estimated_wait_min - prePrediction.estimated_wait_min;
    let impactNote = "Your report contributed to maintaining a reliable crowd estimate.";
    if (deltaMin > 0) {
      impactNote = `Your report adjusted the wait time upward by ${deltaMin} min (${prePrediction.estimated_wait_min}m → ${postPrediction.estimated_wait_min}m).`;
    } else if (deltaMin < 0) {
      impactNote = `Your report adjusted the wait time downward by ${Math.abs(deltaMin)} min (${prePrediction.estimated_wait_min}m → ${postPrediction.estimated_wait_min}m).`;
    }

    return {
      report: newReport,
      impact: {
        previous_estimate_min: prePrediction.estimated_wait_min,
        updated_estimate_min: postPrediction.estimated_wait_min,
        delta_min: deltaMin,
        updated_crowd_level: postPrediction.crowd_level,
        updated_confidence_score: postPrediction.confidence.score,
        note: impactNote
      }
    };
  }
}
