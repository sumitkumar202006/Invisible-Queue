import db from '../db/index.js';
import { PredictionService } from '../services/predictionService.js';

export const orgLogin = (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = db.findUserByEmail(email);
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. (Hint for demo: admin@chdhealth.gov.in / admin123)' });
    }

    // In production: JWT sign token. Here: return standard auth response
    const token = `token_demo_${user.id}_${Date.now()}`;

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        organization_id: user.organization_id
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getOrgDashboard = async (req, res) => {
  try {
    const locations = db.getLocations();
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hourOfDay = now.getHours();

    const serviceSummaries = [];

    for (const loc of locations) {
      for (const srv of loc.services) {
        const reports = db.getActiveReportsForService(srv.id);
        const historical = db.getHistoricalMetric(srv.id, dayOfWeek, hourOfDay);

        const prediction = await PredictionService.getPrediction({
          serviceId: srv.id,
          dayOfWeek,
          hourOfDay,
          recentReports: reports,
          historicalMetric: historical
        });

        serviceSummaries.push({
          service_id: srv.id,
          service_name: srv.name,
          location_name: loc.name,
          current_crowd_level: prediction.crowd_level,
          estimated_wait_min: prediction.estimated_wait_min,
          confidence_score: prediction.confidence.score,
          confidence_label: prediction.confidence.label,
          active_reports_count: reports.length,
          capacity_per_hour: srv.capacity_per_hour || 45
        });
      }
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: serviceSummaries,
      total_active_reports: db.crowdReports.filter(r => !r.is_flagged).length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getServiceTrendsDaily = (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();
    const dayOfWeek = now.getDay() || 1; // Default to Monday if Sunday closed
    const metrics = db.getTodayHistoricalMetrics(id, dayOfWeek);

    const trend = metrics.map(m => ({
      hour: `${m.hour_of_day}:00`,
      hour_num: m.hour_of_day,
      avg_wait_min: Math.round(m.avg_wait_min),
      crowd_score: m.avg_crowd_level,
      crowd_tier: m.avg_crowd_level <= 1.5 ? 'low' : m.avg_crowd_level <= 2.5 ? 'moderate' : 'high'
    }));

    res.json({
      success: true,
      service_id: id,
      day_of_week: dayOfWeek,
      hourly_trend: trend
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPeakHours = (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();
    const dayOfWeek = now.getDay() || 1;
    const metrics = db.getTodayHistoricalMetrics(id, dayOfWeek);

    const peaks = metrics
      .filter(m => m.avg_wait_min >= 60 || m.avg_crowd_level >= 3.0)
      .map(m => ({
        time_slot: `${m.hour_of_day}:00 – ${m.hour_of_day + 1}:00`,
        avg_wait_min: Math.round(m.avg_wait_min),
        severity: m.avg_wait_min >= 90 ? 'critical' : 'high',
        recommended_action: m.avg_wait_min >= 90
          ? 'Open auxiliary token counter and redeploy staff from afternoon slots'
          : 'Maintain all registration windows open'
      }));

    res.json({
      success: true,
      service_id: id,
      peak_periods: peaks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getOrgReportsFeed = (req, res) => {
  try {
    const { id } = req.params;
    const reports = id
      ? db.crowdReports.filter(r => r.service_id === id)
      : db.crowdReports;

    res.json({
      success: true,
      count: reports.length,
      reports: reports.slice(0, 50)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
