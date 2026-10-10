/**
 * API client for Invisible Queue
 */

const BASE_URL = '/api/v1';

export async function fetchLocations(city = '') {
  const url = city ? `${BASE_URL}/locations?city=${encodeURIComponent(city)}` : `${BASE_URL}/locations`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch locations');
  const json = await res.json();
  return json.data || [];
}

export async function fetchLocationById(id) {
  const res = await fetch(`${BASE_URL}/locations/${id}`);
  if (!res.ok) throw new Error('Failed to fetch location');
  const json = await res.json();
  return json.data;
}

export async function fetchServiceStatus(serviceId) {
  const res = await fetch(`${BASE_URL}/services/${serviceId}/status`);
  if (!res.ok) throw new Error('Failed to fetch service status');
  return res.json();
}

export async function fetchServiceRecommendation(serviceId) {
  const res = await fetch(`${BASE_URL}/services/${serviceId}/recommendation`);
  if (!res.ok) throw new Error('Failed to fetch recommendation');
  return res.json();
}

export async function submitCrowdReport(serviceId, { crowdLevel, estimatedWaitMin }) {
  // Generate or retrieve persistent anonymous device fingerprint hash
  let deviceHash = localStorage.getItem('iq_device_hash');
  if (!deviceHash) {
    deviceHash = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem('iq_device_hash', deviceHash);
  }

  const res = await fetch(`${BASE_URL}/services/${serviceId}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      crowd_level: crowdLevel,
      estimated_wait_min: estimatedWaitMin ? parseInt(estimatedWaitMin, 10) : undefined,
      reporter_hash: deviceHash
    })
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to submit report');
  }
  return json;
}

export async function orgLogin({ email, password }) {
  const res = await fetch(`${BASE_URL}/org/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Login failed');
  return json;
}

export async function fetchOrgDashboard() {
  const res = await fetch(`${BASE_URL}/org/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch org dashboard');
  return res.json();
}

export async function fetchDailyTrends(serviceId) {
  const res = await fetch(`${BASE_URL}/org/services/${serviceId}/trends/daily`);
  if (!res.ok) throw new Error('Failed to fetch daily trends');
  return res.json();
}

export async function fetchPeakHours(serviceId) {
  const res = await fetch(`${BASE_URL}/org/services/${serviceId}/peak-hours`);
  if (!res.ok) throw new Error('Failed to fetch peak hours');
  return res.json();
}

export async function fetchReportsFeed(serviceId = '') {
  const url = serviceId ? `${BASE_URL}/org/reports?service_id=${serviceId}` : `${BASE_URL}/org/reports`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch reports feed');
  return res.json();
}
