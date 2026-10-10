import express from 'express';
import { getLocations, getLocationById } from '../controllers/locationController.js';
import {
  getServiceStatus,
  getServiceRecommendation,
  submitServiceReport,
  getServiceReportsSummary
} from '../controllers/serviceController.js';
import {
  orgLogin,
  getOrgDashboard,
  getServiceTrendsDaily,
  getPeakHours,
  getOrgReportsFeed
} from '../controllers/orgController.js';

const router = express.Router();

// Public Citizen Endpoints
router.get('/locations', getLocations);
router.get('/locations/:id', getLocationById);

router.get('/services/:id/status', getServiceStatus);
router.get('/services/:id/recommendation', getServiceRecommendation);
router.post('/services/:id/reports', submitServiceReport);
router.get('/services/:id/reports/summary', getServiceReportsSummary);

// Organization Endpoints
router.post('/org/login', orgLogin);
router.get('/org/dashboard', getOrgDashboard);
router.get('/org/services/:id/trends/daily', getServiceTrendsDaily);
router.get('/org/services/:id/peak-hours', getPeakHours);
router.get('/org/reports', getOrgReportsFeed);

export default router;
