# Architecture Decision Records (ADR) — Invisible Queue

This document records the foundational architectural decisions made for the Invisible Queue platform, including reasoning, alternatives considered, and trade-offs.

---

## ADR 001: Architecture Pattern & Service Boundaries
- **Status:** Approved
- **Context:** Invisible Queue has two distinct domains: a high-throughput public citizen report & query interface, and a statistical/predictive modeling engine for estimating queue wait times.
- **Decision:** Split into a Monorepo with three dedicated components:
  1. `client/`: Single-page Progressive Web App (React + Vite + Tailwind CSS) with route-based code splitting for Citizen vs. Organization workflows.
  2. `server/`: Node.js / Express REST API handling authentication, rate limiting, abuse detection, database interactions, and presentation logic.
  3. `prediction/`: Standalone Python FastAPI microservice dedicated to statistical aggregation, confidence scoring, and waiting-time forecasting models.
- **Consequences:** Clean separation of concerns; prevents ML/statistical calculations from blocking Node.js event loop; allows independent scaling and future substitution of statistical models with trained ML models without touching client/server codebase.

---

## ADR 002: Transparent Baseline Prediction Model (WMSB v1)
- **Status:** Approved
- **Context:** At launch, no official live hospital APIs exist. Machine learning models require clean historical ground truth that does not exist on day 1 (cold-start problem). Fabricating "99% accurate neural network predictions" violates our core transparency principle.
- **Decision:** Implement the **Weighted Multi-Source Baseline (WMSB v1)**:
  - Dynamic weighting between recency-decayed crowd reports ($W_{reports}$) and historical baselines ($W_{history}$).
  - Exponential decay ($\lambda = 0.02$, half-life $\approx 35\text{ mins}$) to weight fresh citizen reports over stale ones.
  - Transparent 0–100 confidence score based on report volume, recency, agreement, and baseline availability.
  - Range estimation (low/high) based on uncertainty rather than a misleading single-minute certainty.
- **Consequences:** Fully explainable; honest about limitations; easy to test and validate mathematically before migrating to regressors/gradient-boosted models in V2.

---

## ADR 003: Database Strategy (PostgreSQL with Modular Data Layer)
- **Status:** Approved
- **Context:** The system requires time-series aggregation (hourly trends, day-of-week averages, peak hour analysis) alongside normalized relationships (organizations -> locations -> services -> operating hours -> reports).
- **Decision:** PostgreSQL with normalized tables and indexed timestamp columns. For zero-friction local development without immediate cloud credential dependencies, the server data layer supports a swappable interface (PostgreSQL pool with built-in in-memory fallback adapter that mirrors schema queries for local demo/testing).
- **Consequences:** Easy migration to Supabase/Render PostgreSQL in production; analytical queries use standard SQL aggregation.

---

## ADR 004: Citizen Anonymity & Abuse Mitigation
- **Status:** Approved
- **Context:** Citizens should not need to register or provide phone numbers to report crowd status. Friction must be minimal. However, spam or malicious reports must be deterred.
- **Decision:**
  - No user accounts required for citizens.
  - Client sends an ephemeral SHA-256 device/session hash solely used for in-memory rate limiting (e.g., max 1 report per 10 minutes per service).
  - Outlier detection flags reports that deviate by more than 2 standard deviations from concurrent reports.
  - Expiry timestamp (`expires_at = created_at + 2 hours`) automatically scopes active reports.
- **Consequences:** High privacy compliance; minimal barrier to participation; robust protection against coordinated spam.

---

## ADR 005: Honest Data Attribution & Source Labelling
- **Status:** Approved
- **Context:** The system must never deceive users into thinking simulated or historical data is live government telemetry.
- **Decision:** Every API response and UI card explicitly includes:
  - `data_sources`: { recent_reports: N, historical_available: boolean, official_data: boolean }
  - `last_updated`: ISO timestamp and humanized relative freshness ("Updated 6 mins ago")
  - Explicit badge indicating data origin ("User-Reported", "Historical Average", or "Simulated Baseline").
