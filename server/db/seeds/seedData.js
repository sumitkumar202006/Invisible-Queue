/**
 * Realistic Seed Data for Invisible Queue MVP
 * Initial Focus: Government Hospital OPDs (Chandigarh)
 */

export const seedOrganizations = [
  {
    id: "org-chd-health-01",
    name: "Department of Health & Family Welfare Chandigarh",
    type: "hospital",
    contact_email: "health.chd@nic.in",
    is_active: true
  }
];

export const seedLocations = [
  {
    id: "loc-dh-30",
    organization_id: "org-chd-health-01",
    name: "Civil Hospital Sector 45 (District Health Centre)",
    address: "Sector 45-B, Burail, Chandigarh",
    city: "Chandigarh",
    state: "Chandigarh",
    pincode: "160047",
    latitude: 30.7088,
    longitude: 76.7644,
    is_active: true
  },
  {
    id: "loc-ch-22",
    organization_id: "org-chd-health-01",
    name: "Government Multi-Specialty Hospital (GMSH-16 / Sector 22 Poly)",
    address: "Sector 22-D, Jan Marg, Chandigarh",
    city: "Chandigarh",
    state: "Chandigarh",
    pincode: "160022",
    latitude: 30.7351,
    longitude: 76.7725,
    is_active: true
  },
  {
    id: "loc-sdh-mani",
    organization_id: "org-chd-health-01",
    name: "Civil Hospital Manimajra (Sub-Divisional Hospital)",
    address: "Old Ropar Road, Manimajra, Chandigarh",
    city: "Chandigarh",
    state: "Chandigarh",
    pincode: "160101",
    latitude: 30.7189,
    longitude: 76.8404,
    is_active: true
  }
];

export const seedServices = [
  {
    id: "srv-dh30-opd",
    location_id: "loc-dh-30",
    name: "General OPD Registration & Token",
    service_type: "opd",
    avg_service_time_min: 7,
    capacity_per_hour: 40,
    is_active: true
  },
  {
    id: "srv-dh30-pharma",
    location_id: "loc-dh-30",
    name: "Pharmacy & Medicine Dispensary",
    service_type: "dispensary",
    avg_service_time_min: 4,
    capacity_per_hour: 60,
    is_active: true
  },
  {
    id: "srv-ch22-opd",
    location_id: "loc-ch-22",
    name: "General OPD Registration",
    service_type: "opd",
    avg_service_time_min: 8,
    capacity_per_hour: 45,
    is_active: true
  },
  {
    id: "srv-sdh-opd",
    location_id: "loc-sdh-mani",
    name: "Central OPD Registration & Triage",
    service_type: "opd",
    avg_service_time_min: 6,
    capacity_per_hour: 50,
    is_active: true
  }
];

// Operating hours (Mon-Sat: 08:30 to 16:00, Sun: Closed)
export const seedOperatingHours = [
  // Generate for all services: Mon(1) to Sat(6)
  ...seedServices.flatMap(service => [
    { id: `oh-${service.id}-0`, service_id: service.id, day_of_week: 0, open_time: "08:30", close_time: "13:00", is_closed: true },
    { id: `oh-${service.id}-1`, service_id: service.id, day_of_week: 1, open_time: "08:30", close_time: "16:00", is_closed: false },
    { id: `oh-${service.id}-2`, service_id: service.id, day_of_week: 2, open_time: "08:30", close_time: "16:00", is_closed: false },
    { id: `oh-${service.id}-3`, service_id: service.id, day_of_week: 3, open_time: "08:30", close_time: "16:00", is_closed: false },
    { id: `oh-${service.id}-4`, service_id: service.id, day_of_week: 4, open_time: "08:30", close_time: "16:00", is_closed: false },
    { id: `oh-${service.id}-5`, service_id: service.id, day_of_week: 5, open_time: "08:30", close_time: "16:00", is_closed: false },
    { id: `oh-${service.id}-6`, service_id: service.id, day_of_week: 6, open_time: "08:30", close_time: "14:00", is_closed: false }
  ])
];

// Helper to generate hourly historical metrics across days
export function generateSeedHistoricalMetrics() {
  const metrics = [];
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16];

  seedServices.forEach(service => {
    for (let day = 1; day <= 6; day++) {
      hours.forEach(hour => {
        let avgWait = 40;
        let avgCrowd = 2.0; // moderate

        if (hour === 8) {
          avgWait = 35; avgCrowd = 2.0; // moderate
        } else if (hour === 9) {
          avgWait = 75; avgCrowd = 3.1; // high
        } else if (hour === 10) {
          avgWait = 95; avgCrowd = 3.6; // high / peak
        } else if (hour === 11) {
          avgWait = 80; avgCrowd = 3.2; // high
        } else if (hour === 12) {
          avgWait = 50; avgCrowd = 2.2; // moderate
        } else if (hour === 13) {
          avgWait = 30; avgCrowd = 1.4; // low
        } else if (hour === 14) {
          avgWait = 25; avgCrowd = 1.3; // low (recommended slot!)
        } else if (hour === 15) {
          avgWait = 35; avgCrowd = 1.8; // low-moderate (closing soon)
        } else if (hour === 16) {
          avgWait = 20; avgCrowd = 1.2;
        }

        // Slight Saturday surge adjustment
        if (day === 6 && hour >= 9 && hour <= 11) {
          avgWait += 15;
          avgCrowd = Math.min(4.0, avgCrowd + 0.3);
        }

        metrics.push({
          id: `hist-${service.id}-${day}-${hour}`,
          service_id: service.id,
          day_of_week: day,
          hour_of_day: hour,
          avg_wait_min: avgWait,
          avg_crowd_level: avgCrowd,
          sample_count: 45,
          data_source: "seed",
          updated_at: new Date().toISOString()
        });
      });
    }
  });

  return metrics;
}

// Recent sample crowd reports (submitted within the last 15-60 minutes)
export function generateInitialReports() {
  const now = Date.now();
  return [
    {
      id: "rep-001",
      service_id: "srv-dh30-opd",
      crowd_level: "high",
      estimated_wait_min: 85,
      reporter_hash: "hash_anon_demo_1",
      is_flagged: false,
      created_at: new Date(now - 8 * 60 * 1000).toISOString(), // 8 mins ago
      expires_at: new Date(now + 112 * 60 * 1000).toISOString()
    },
    {
      id: "rep-002",
      service_id: "srv-dh30-opd",
      crowd_level: "high",
      estimated_wait_min: 90,
      reporter_hash: "hash_anon_demo_2",
      is_flagged: false,
      created_at: new Date(now - 16 * 60 * 1000).toISOString(), // 16 mins ago
      expires_at: new Date(now + 104 * 60 * 1000).toISOString()
    },
    {
      id: "rep-003",
      service_id: "srv-dh30-opd",
      crowd_level: "moderate",
      estimated_wait_min: 70,
      reporter_hash: "hash_anon_demo_3",
      is_flagged: false,
      created_at: new Date(now - 28 * 60 * 1000).toISOString(), // 28 mins ago
      expires_at: new Date(now + 92 * 60 * 1000).toISOString()
    },
    {
      id: "rep-004",
      service_id: "srv-ch22-opd",
      crowd_level: "moderate",
      estimated_wait_min: 45,
      reporter_hash: "hash_anon_demo_4",
      is_flagged: false,
      created_at: new Date(now - 12 * 60 * 1000).toISOString(),
      expires_at: new Date(now + 108 * 60 * 1000).toISOString()
    },
    {
      id: "rep-005",
      service_id: "srv-sdh-opd",
      crowd_level: "low",
      estimated_wait_min: 25,
      reporter_hash: "hash_anon_demo_5",
      is_flagged: false,
      created_at: new Date(now - 10 * 60 * 1000).toISOString(),
      expires_at: new Date(now + 110 * 60 * 1000).toISOString()
    }
  ];
}
