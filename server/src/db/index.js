import pg from 'pg';
import dotenv from 'dotenv';
import {
  seedOrganizations,
  seedLocations,
  seedServices,
  seedOperatingHours,
  generateSeedHistoricalMetrics,
  generateInitialReports
} from '../../db/seeds/seedData.js';

dotenv.config();

const { Pool } = pg;

// In-Memory Storage Adapter for instant zero-dependency local development
class InMemoryDatabase {
  constructor() {
    this.organizations = [...seedOrganizations];
    this.locations = [...seedLocations];
    this.services = [...seedServices];
    this.operatingHours = [...seedOperatingHours];
    this.historicalMetrics = generateSeedHistoricalMetrics();
    this.crowdReports = generateInitialReports();
    this.predictions = [];
    this.users = [
      {
        id: "usr-admin-01",
        email: "admin@chdhealth.gov.in",
        password_hash: "admin123", // For demo/MVP org login
        display_name: "Dr. R. Sharma (Medical Superintendent)",
        role: "org_admin",
        organization_id: "org-chd-health-01"
      }
    ];
    console.log('[DB] Initialized in-memory data store with seed dataset');
  }

  getLocations(filters = {}) {
    let result = [...this.locations];
    if (filters.city) {
      result = result.filter(l => l.city.toLowerCase() === filters.city.toLowerCase());
    }
    return result.map(loc => {
      const org = this.organizations.find(o => o.id === loc.organization_id);
      const services = this.services.filter(s => s.location_id === loc.id);
      return { ...loc, organization: org, services };
    });
  }

  getLocationById(id) {
    const loc = this.locations.find(l => l.id === id);
    if (!loc) return null;
    const org = this.organizations.find(o => o.id === loc.organization_id);
    const services = this.services.filter(s => s.location_id === loc.id).map(s => {
      const hours = this.operatingHours.filter(h => h.service_id === s.id);
      return { ...s, operating_hours: hours };
    });
    return { ...loc, organization: org, services };
  }

  getServiceById(id) {
    const srv = this.services.find(s => s.id === id);
    if (!srv) return null;
    const location = this.locations.find(l => l.id === srv.location_id);
    const hours = this.operatingHours.filter(h => h.service_id === srv.id);
    return { ...srv, location, operating_hours: hours };
  }

  getActiveReportsForService(serviceId, maxAgeMinutes = 120) {
    const now = Date.now();
    const cutoff = new Date(now - maxAgeMinutes * 60 * 1000).toISOString();
    return this.crowdReports
      .filter(r => r.service_id === serviceId && !r.is_flagged && r.created_at >= cutoff)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getHistoricalMetric(serviceId, dayOfWeek, hourOfDay) {
    return this.historicalMetrics.find(
      h => h.service_id === serviceId && h.day_of_week === dayOfWeek && h.hour_of_day === hourOfDay
    ) || null;
  }

  getTodayHistoricalMetrics(serviceId, dayOfWeek) {
    return this.historicalMetrics
      .filter(h => h.service_id === serviceId && h.day_of_week === dayOfWeek)
      .sort((a, b) => a.hour_of_day - b.hour_of_day);
  }

  insertCrowdReport(report) {
    const newReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      is_flagged: false,
      ...report
    };
    this.crowdReports.unshift(newReport);
    return newReport;
  }

  insertPrediction(pred) {
    const newPred = {
      id: `pred-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...pred
    };
    this.predictions.unshift(newPred);
    return newPred;
  }

  findUserByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}

// Database Singleton
let dbInstance = null;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  console.log('[DB] Connecting to PostgreSQL instance...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  dbInstance = {
    mode: 'postgres',
    pool,
    query: (text, params) => pool.query(text, params)
  };
} else {
  console.log('[DB] No DATABASE_URL provided. Using in-memory store with seed data.');
  dbInstance = new InMemoryDatabase();
  dbInstance.mode = 'in_memory';
}

export default dbInstance;
