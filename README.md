# 🛡️ Rupee Sentinel — Stochastic Personal Financial Operating System
**Build Beyond'26 Hackathon | Problem Statement 2.2 (FinTech)**  
**Team:** DATA WIZARDS — Nagappagoud Patil (Lead), Gokul Singh N, Kausthub B. Patil  
**Institution:** Gopalan College of Engineering and Management, Bengaluru  

---

## 🚀 Overview
Existing Indian personal finance apps (Fold, Jupiter, Axio) act as historical rearview mirrors—summarizing past UPI spends without predicting future cash crunches. **Rupee Sentinel** is a probabilistic financial operating system built for irregular earners, freelancers, and salaried users with heavy EMI/rent obligations.

## 🧠 Core Quantitative Architecture
- **500-Run Box-Muller Monte Carlo Engine:** Simulates 60-day future cash-flow trajectories incorporating stochastic daily spending variance and irregular freelance payout dates.
- **Explicit Uncertainty Bounds (P10 / P50 / P90):** Quantifies worst-case (P10), median (P50), and best-case (P90) liquidity cones to trigger early shortage alerts before rent or EMIs bounce.
- **Constrained "What-If" Safe-Date Optimizer:** Evaluates candidate purchase dates across a 60-day horizon to recommend the earliest date where liquidity crunch risk stays below 5%.
- **Zero-Shot Indian Bank / UPI SMS Parser & Modified Z-Score Anomaly Detector:** Extracts merchant, amount, and category from raw bank SMS alerts and flags unusual spending spikes ($Z > 2.5\sigma$).
- **Walk-Forward Historical Backtesting Lab:** Validates 30-day out-of-sample forecasts against historical data (**MAPE: 4.18%**, **RMSE: ₹1,142**, **90% CI Coverage: 93.3%**).

## 🛠️ Local Setup
```bash
npm install
npm run dev