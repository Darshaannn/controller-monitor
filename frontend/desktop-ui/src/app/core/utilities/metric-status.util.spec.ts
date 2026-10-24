import { describe, it, expect } from 'vitest';
import { calculateMetricStatus } from './metric-status.util';

describe('calculateMetricStatus', () => {
  const baseline = 100;

  it('evaluates Normal status when deviation <= 10%', () => {
    expect(calculateMetricStatus(100, baseline)).toBe('normal'); // 0%
    expect(calculateMetricStatus(105, baseline)).toBe('normal'); // +5%
    expect(calculateMetricStatus(95, baseline)).toBe('normal'); // -5%
    expect(calculateMetricStatus(110, baseline)).toBe('normal'); // +10% threshold boundary
    expect(calculateMetricStatus(90, baseline)).toBe('normal'); // -10% threshold boundary
  });

  it('evaluates Warning status when 10% < deviation <= 20%', () => {
    expect(calculateMetricStatus(110.1, baseline)).toBe('warning'); // +10.1%
    expect(calculateMetricStatus(89.9, baseline)).toBe('warning'); // -10.1%
    expect(calculateMetricStatus(115, baseline)).toBe('warning'); // +15%
    expect(calculateMetricStatus(120, baseline)).toBe('warning'); // +20% threshold boundary
    expect(calculateMetricStatus(80, baseline)).toBe('warning'); // -20% threshold boundary
  });

  it('evaluates Critical status when deviation > 20%', () => {
    expect(calculateMetricStatus(120.1, baseline)).toBe('critical'); // +20.1%
    expect(calculateMetricStatus(79.9, baseline)).toBe('critical'); // -20.1%
    expect(calculateMetricStatus(150, baseline)).toBe('critical'); // +50%
    expect(calculateMetricStatus(0, baseline)).toBe('critical'); // -100%
  });

  it('safely handles non-finite or invalid inputs', () => {
    expect(calculateMetricStatus(NaN, baseline)).toBe('critical');
    expect(calculateMetricStatus(Infinity, baseline)).toBe('critical');
    expect(calculateMetricStatus(100, NaN)).toBe('critical');
  });

  it('handles zero baseline edge cases safely without division by zero', () => {
    expect(calculateMetricStatus(0, 0)).toBe('normal');
    expect(calculateMetricStatus(0.5, 0)).toBe('warning');
    expect(calculateMetricStatus(5, 0)).toBe('critical');
  });
});
