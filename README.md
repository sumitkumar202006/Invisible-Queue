# Invisible Queue (अदृश्य कतार)

> **"Make the queue visible and predictable so citizens and service providers can make better decisions."**

Invisible Queue is a smart waiting-time prediction and crowd-management platform engineered for essential public services (Government Hospital OPDs, District Administrative Offices, Ration Distribution Centers, and Diagnostic Labs).

---

## 🎯 The Problem & Vision
People often travel hours to essential public facilities with zero visibility into queue lengths or processing rates. This leads to overcrowded waiting halls, wasted working days, and failed visits when counters close before people are served.

Invisible Queue does not claim to magically eliminate queues. Instead, it provides **predictive transparency, decision support, and congestion management** by combining:
1. **Live/Official Queue Data** *(when available)*
2. **Anonymous Citizen Crowd Reports** *(recency-weighted & outlier-filtered)*
3. **Historical Day/Time Patterns**

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  React (Vite) + Tailwind CSS + PWA + Hindi/English i18n     │
│   ├── Citizen View (Crowd status, wait range, planner)      │
│   └── Organization Dashboard (Live monitoring, trends)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST
┌──────────────────────────────▼──────────────────────────────┐
│                      Express API Layer                      │
│   Node.js + Zod Validation + Rate Limiter + Auth Guard      │
│   ├── /api/v1/locations & /services                         │
│   ├── /api/v1/services/:id/status (Core status & warnings)  │
│   ├── /api/v1/services/:id/reports (Anonymous submission)   │
│   └── /api/v1/org/* (Analytics, peak hours, trends)         │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     PostgreSQL Database     ││   Prediction Microservice   │
│ Organizations, Locations,   ││    Python 3 + FastAPI        │
│ Services, Crowd Reports,    ││ Weighted Multi-Source Model  │
│ Historical Hourly Baselines ││ (Recency decay, confidence)  │
└─────────────────────────────┘└──────────────────────────────┘
```

---

## 🔑 Core Features

- **Transparent Wait Time Range:** Displays realistic bounds (e.g. `45–75 mins`) rather than misleading single-minute guarantees.
- **Explainable Confidence Score (0–100):** Clearly breaks down *why* a confidence level is Low, Medium, or High based on sample size, recency, and consensus.
- **Failed-Visit Warning System:** Evaluates remaining service hours against estimated waiting time, warning citizens if their visit is at high risk of arriving too late.
- **Smart Visit Planner:** Identifies optimal low-congestion time windows for the current day.
- **Anonymous Crowd Reports with Feedback:** Citizens can submit one-tap crowd levels; the API returns the instant impact their report had on the forecast.
- **Data Source Honesty:** Explicit badges clarify whether numbers derive from real user reports, historical baselines, or simulated demo seeds.
- **Organization Dashboard:** Capacity trends, hourly crowd breakdown, peak-hour heatmaps, and report auditing.
- **Civic Design System & Accessibility:** High-contrast, clean typography, responsive layout, and Hindi language support.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sumitkumar202006/Invisible-Queue.git
   cd Invisible-Queue
   ```

2. **Backend API (`server`):**
   ```bash
   cd server
   npm install
   npm run dev
   # Runs on http://localhost:5000
   ```

3. **Prediction Engine (`prediction`):**
   ```bash
   cd ../prediction
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   # Runs on http://localhost:8000
   ```

4. **Frontend App (`client`):**
   ```bash
   cd ../client
   npm install
   npm run dev
   # Runs on http://localhost:5173
   ```

---

## 📜 Documentation
- [Architecture Decisions (ADR)](docs/DECISIONS.md)
- [Prediction Methodology](docs/PREDICTION.md) *(in progress)*
- [API Specification](docs/API.md) *(in progress)*
