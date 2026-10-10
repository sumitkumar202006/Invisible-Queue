import { z } from 'zod';
import db from '../db/index.js';
import { PredictionService } from '../services/predictionService.js';
import { PlannerService } from '../services/plannerService.js';
import { ReportService } from '../services/reportService.js';

const reportSchema = z.object({
  crowd_level: z.enum(['low', 'moderate', 'high', 'very_high']),
  estimated_wait_min: z.number().int().min(1).max(480).optional(),
  reporter_hash: z.string().max(64).optional()
});

function getHumanFreshness(date) {
  const diffSec = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHrs = Math.round(diffMin / 60);
  return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
}

export const getServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const service = db.getServiceById(id);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const hourOfDay = now.getHours();

    const activeReports = db.getActiveReportsForService(id);
    const historicalMetric = db.getHistoricalMetric(id, dayOfWeek, hourOfDay);

    // Run prediction
    const prediction = await PredictionService.getPrediction({
      serviceId: id,
      dayOfWeek,
      hourOfDay,
      recentReports: activeReports,
      historicalMetric
    });

    // Check operating hours & failed visit risk
    const operatingHoursToday = (service.operating_hours || []).find(h => h.day_of_week === dayOfWeek);
    const visitRisk = PlannerService.evaluateFailedVisitRisk({
      estimatedWaitMin: prediction.estimated_wait_min,
      waitRangeHigh: prediction.wait_range.high_min,
      operatingHoursToday,
      currentTime: now
    });

    const mostRecentReport = activeReports.length > 0 ? activeReports[0].created_at : null;
    const lastUpdated = mostRecentReport || new Date().toISOString();

    res.json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        service_type: service.service_type,
        location: {
          id: service.location?.id,
          name: service.location?.name,
          address: service.location?.address,
          city: service.location?.city
        }
      },
      status: {
        crowd_level: prediction.crowd_level,
        estimated_wait_min: prediction.estimated_wait_min,
        wait_range: prediction.wait_range,
        confidence: prediction.confidence,
        data_sources: {
          ...prediction.data_sources,
          data_category: activeReports.length > 0 ? 'User-Reported & Historical' : 'Historical Baseline'
        },
        last_updated: lastUpdated,
        freshness: getHumanFreshness(lastUpdated)
      },
      warning: visitRisk
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getServiceRecommendation = (req, res) => {
  try {
    const { id } = req.params;
    const service = db.getServiceById(id);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();
    const historicalToday = db.getTodayHistoricalMetrics(id, dayOfWeek);

    const recommendation = PlannerService.findRecommendedVisitWindow({
      historicalMetricsToday: historicalToday,
      currentHour
    });

    res.json({
      success: true,
      service_id: id,
      recommendation
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const submitServiceReport = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = reportSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.format()
      });
    }

    const result = await ReportService.submitReport({
      serviceId: id,
      crowdLevel: parseResult.data.crowd_level,
      estimatedWaitMin: parseResult.data.estimated_wait_min,
      reporterHash: parseResult.data.reporter_hash
    });

    res.status(201).json({
      success: true,
      message: 'Crowd observation submitted successfully. Thank you!',
      data: result
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

export const getServiceReportsSummary = (req, res) => {
  try {
    const { id } = req.params;
    const reports = db.getActiveReportsForService(id);
    res.json({
      success: true,
      service_id: id,
      active_reports_count: reports.length,
      reports: reports.slice(0, 10).map(r => ({
        id: r.id,
        crowd_level: r.crowd_level,
        estimated_wait_min: r.estimated_wait_min,
        created_at: r.created_at,
        freshness: getHumanFreshness(r.created_at)
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
