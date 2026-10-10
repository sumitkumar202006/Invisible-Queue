# REST API Documentation — Invisible Queue (v1)

Base URL: `http://localhost:5000/api/v1`

---

## 1. Locations

### `GET /locations`
Retrieve all registered civic service locations.

**Query Parameters:**
- `city` (optional): Filter locations by city name (e.g. `?city=Chandigarh`).

**Example Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "loc-dh-30",
      "name": "Civil Hospital Sector 45 (District Health Centre)",
      "address": "Sector 45-B, Burail, Chandigarh",
      "city": "Chandigarh",
      "services": [
        {
          "id": "srv-dh30-opd",
          "name": "General OPD Registration & Token",
          "service_type": "opd"
        }
      ]
    }
  ]
}
```

---

## 2. Services & Waiting Times

### `GET /services/:id/status`
Retrieve current queue prediction, crowd tier, wait time range, confidence score breakdown, data source attribution, and closing schedule warnings.

**Example Response:**
```json
{
  "success": true,
  "service": {
    "id": "srv-dh30-opd",
    "name": "General OPD Registration & Token",
    "location": {
      "name": "Civil Hospital Sector 45"
    }
  },
  "status": {
    "crowd_level": "high",
    "estimated_wait_min": 83,
    "wait_range": {
      "low_min": 56,
      "high_min": 110
    },
    "confidence": {
      "score": 51,
      "label": "medium",
      "factors": {
        "volume_score": 15,
        "recency_score": 21,
        "agreement_score": 15,
        "history_score": 0,
        "official_score": 0
      },
      "explanation": "Calculated from 3 recent citizen report(s) and historical patterns"
    },
    "data_sources": {
      "recent_reports_count": 3,
      "has_historical": true,
      "has_official_data": false,
      "data_category": "User-Reported & Historical"
    },
    "last_updated": "2026-10-10T17:24:32.049Z",
    "freshness": "8 mins ago"
  },
  "warning": {
    "has_warning": true,
    "type": "failed_visit_risk",
    "severity": "high",
    "message": "Service closes in 50 mins. Higher wait times may prevent you from being served.",
    "close_time": "16:00"
  }
}
```

### `GET /services/:id/recommendation`
Retrieve the recommended arrival time window for today.

**Example Response:**
```json
{
  "success": true,
  "service_id": "srv-dh30-opd",
  "recommendation": {
    "has_recommendation": true,
    "is_for_today": true,
    "recommended_window": "2:00 PM – 3:00 PM",
    "expected_wait_min": 25,
    "expected_crowd_level": "low",
    "explanation": "Historically lower queue length with ~55% shorter waiting time compared to morning rush hours."
  }
}
```

---

## 3. Citizen Crowd Reporting

### `POST /services/:id/reports`
Submit an anonymous crowd observation.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "crowd_level": "high",
  "estimated_wait_min": 85,
  "reporter_hash": "dev_device_hash_xyz"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Crowd observation submitted successfully. Thank you!",
  "data": {
    "report": {
      "id": "rep-1728581",
      "created_at": "2026-10-10T17:35:00.000Z",
      "crowd_level": "high",
      "estimated_wait_min": 85
    },
    "impact": {
      "previous_estimate_min": 80,
      "updated_estimate_min": 88,
      "delta_min": 8,
      "updated_confidence_score": 62,
      "note": "Your report adjusted the wait time upward by 8 min (80m → 88m)."
    }
  }
}
```

---

## 4. Organization Analytics

### `POST /org/login`
Authenticate hospital administrator.

### `GET /org/dashboard`
Returns live status and capacity across all facilities.

### `GET /org/services/:id/trends/daily`
Hourly wait time pattern from opening to closing.

### `GET /org/services/:id/peak-hours`
Critical congestion periods and resource redeployment recommendations.

### `GET /org/reports`
Raw stream of incoming reports for auditing.
