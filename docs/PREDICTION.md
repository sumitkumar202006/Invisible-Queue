# Prediction Methodology: Weighted Multi-Source Baseline (WMSB v1)

## 1. Overview
Invisible Queue avoids "black-box fake AI" claims. The v1 engine implements a transparent, deterministic statistical prediction model called the **Weighted Multi-Source Baseline (WMSB v1)**.

The model combines:
1. **Live/Official Queue Data** (weight $W_{official}$, default null for V1)
2. **Anonymous Citizen Crowd Reports** (weight $W_{reports}$, recency-decayed)
3. **Historical Day/Hour Patterns** (weight $W_{history}$)

---

## 2. Mathematical Formulation

### 2.1 Exponential Recency Weighting
Reports decay in relevance as time passes. We model this via continuous exponential decay with rate $\lambda = 0.02$, corresponding to a half-life of approximately 34.6 minutes:

$$w_i = \exp(-\lambda \cdot \Delta t_i)$$

Where $\Delta t_i$ is the age of report $i$ in minutes ($0 \le \Delta t_i \le 120$). Reports older than 120 minutes expire automatically.

The aggregate report wait time is computed as:

$$\overline{T}_{reports} = \frac{\sum_{i=1}^{N} w_i \cdot T_i}{\sum_{i=1}^{N} w_i}$$

Where $T_i$ is the reported wait time (or standard tier default: Low = 15m, Moderate = 45m, High = 90m, Very High = 150m).

### 2.2 Signal Fusion Weights
The blended estimated wait time $\hat{T}$ is calculated as:

$$\hat{T} = W_{official} \cdot T_{official} + W_{reports} \cdot \overline{T}_{reports} + W_{history} \cdot T_{history}$$

Dynamic weight allocation:
- **Both recent reports and historical data available:**
  $$W_{reports} = 0.65, \quad W_{history} = 0.35$$
- **Only citizen reports available:**
  $$W_{reports} = 1.00, \quad W_{history} = 0.00$$
- **Only historical baseline available (no recent reports):**
  $$W_{reports} = 0.00, \quad W_{history} = 1.00$$
- **Official data available:**
  $$W_{official} = 0.50, \quad W_{reports} = 0.30, \quad W_{history} = 0.20$$

---

## 3. Confidence Score Formulation (0–100)

The confidence score explicitly quantifies data fidelity across 5 observable factors:

| Factor | Maximum Points | Calculation |
|---|---|---|
| **Volume Score** | 35 | $\min(35, N_{reports} \times 5)$ (saturates at 7 reports) |
| **Recency Score** | 25 | $\max\left(0, \min\left(25, 25 \times \left(1 - \frac{\overline{\Delta t}}{120}\right)\right)\right)$ |
| **Consensus Score** | 20 | Inverse standard deviation of observer crowd ratings ($> 0.8 \to 10\text{ pts}$, $\le 0.4 \to 20\text{ pts}$) |
| **Historical Match** | 15 | 15 points if day/hour slot sample count $\ge 30$ |
| **Official Data** | 5 | 5 points when live API telemetry is active |

Confidence tiers:
- **High:** $\ge 67$
- **Moderate:** $34 - 66$
- **Low:** $< 34$

---

## 4. Uncertainty Bounds (Wait Time Range)

Rather than giving deceptive single-minute certainty, Invisible Queue always publishes realistic bounds:

$$\text{Uncertainty Rate } U = 0.15 + 0.35 \times \left(1 - \frac{\text{Confidence Score}}{100}\right)$$

- **Low Bound:** $\max(5, \text{round}(\hat{T} \times (1 - U)))$
- **High Bound:** $\text{round}(\hat{T} \times (1 + U))$

When confidence is high (e.g. 85), $U \approx 20\%$. When confidence is low (e.g. 30), $U \approx 40\%$.

---

## 5. Failed-Visit Prevention Algorithm

Let $T_{remaining}$ be the remaining operating minutes before daily closure:

1. If $T_{remaining} \le 0 \implies$ **Facility Closed**.
2. If $\hat{T}_{high} > T_{remaining}$:
   - If $\hat{T} > T_{remaining} \implies$ **Severity: Very High** ("Estimated wait will exceed counter closing time").
   - Else $\implies$ **Severity: High** ("High risk of incomplete visit due to queue volume").
3. If $\hat{T}_{high} > 0.75 \times T_{remaining} \implies$ **Severity: Moderate** ("Plan prompt arrival to beat cutoff").
