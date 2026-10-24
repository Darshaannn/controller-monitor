# TECHNICAL ASSUMPTIONS & DESIGN CONSTRAINTS

**Project:** Embedded Controller — Real-Time Telemetry Monitoring Dashboard

---

## 1. Simulation Algorithm Implementation Details (Phase 2)
- **Baseline Values:**
  - Velocity: `185.4 cm/s` (min: `0`, max: `1000`)
  - Pressure: `1012 mbar` (min: `0`, max: `5000`)
  - Temperature: `36.8 °C` (min: `-273.15`, max: `500`)
- **Cycle Cadence:** Exactly 1 tick per second (1,000ms timer).
- **Variation Phase (Cycles 1–5):**
  - Delta calculation: `delta = currentValue * randomFraction` where `randomFraction = (random() * 2 - 1) * 0.10` ($\in [-10\%, +10\%]$).
  - Safety constraints: Clamped to physical bounds, preventing negative speed or negative absolute pressure.
- **Recovery Phase (Cycles 6–10 / 5 recovery cycles):**
  - Smooth progression toward canonical baseline: `nextValue = currentValue + (baseline - currentValue) * 0.45`.
  - Absolute deviation from baseline strictly decreases monotonically on each recovery tick.
- **Cycle Continuity:**
  - After 5 recovery cycles, the engine seamlessly resets to `VARIATION` cycle 1, repeating indefinitely without drift or sudden jumps.
- **Ring Buffer:** Maximum 100 historical points stored per metric. Oldest sample is shifted out when point 101 arrives. Snapshots returned over the API are defensive clones, preventing client mutation of internal history.

---

## 2. Measurement Status Evaluation Assumptions
Status is evaluated against baseline canonical values using relative deviation:
$$\text{deviation} = \frac{|\text{current\_value} - \text{baseline}|}{\text{baseline}} \times 100\%$$

- **Normal:** deviation $\le 10\%$
- **Warning:** $10\% < \text{deviation} \le 20\%$
- **Critical:** deviation $> 20\%$

Evaluation occurs exclusively on canonical values so that changing the user's display unit (e.g., to Fahrenheit or psi) never alters status calculation.

---

## 3. Session Export Retention Assumptions
- While the backend maintains a rolling 100-sample window for real-time chart rendering, the frontend maintains a dedicated in-memory session accumulator.
- The session export buffer accumulates unique timestamped samples received during the active session up to a safe cap of 5,000 points to prevent browser memory leaks.
- Exports are aligned by UTC timestamp across all three metrics.
