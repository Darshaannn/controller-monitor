import { MetricKey, MeasurementUnit, CANONICAL_BASELINES } from 'telemetry-contracts';
import type { MetricDisplayConfig } from '../interfaces';

export type { MetricDisplayConfig };

export const METRIC_DISPLAY_CONFIGS: Record<MetricKey, MetricDisplayConfig> = {
  velocity: {
    key: 'velocity',
    label: 'Velocity',
    defaultUnit: CANONICAL_BASELINES.velocity.unit,
    baseline: CANONICAL_BASELINES.velocity.value,
    gaugeMin: 0,
    gaugeMax: 300,
    icon: 'speed',
    description: 'Controller linear motion rate',
  },
  pressure: {
    key: 'pressure',
    label: 'Pressure',
    defaultUnit: CANONICAL_BASELINES.pressure.unit,
    baseline: CANONICAL_BASELINES.pressure.value,
    gaugeMin: 600,
    gaugeMax: 1400,
    icon: 'compress',
    description: 'Chamber atmospheric pressure',
  },
  temperature: {
    key: 'temperature',
    label: 'Temperature',
    defaultUnit: CANONICAL_BASELINES.temperature.unit,
    baseline: CANONICAL_BASELINES.temperature.value,
    gaugeMin: 0,
    gaugeMax: 70,
    icon: 'device_thermostat',
    description: 'Core controller temperature',
  },
};
