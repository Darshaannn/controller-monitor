import { describe, it, expect } from 'vitest';
import {
  convertVelocity,
  convertPressure,
  convertTemperature,
  toCanonicalVelocity,
  toCanonicalPressure,
  toCanonicalTemperature,
  convertMetricValue,
  formatMeasurement,
  SUPPORTED_UNITS,
} from './unit-conversion.util';
import { VelocityUnit, PressureUnit, TemperatureUnit } from 'telemetry-contracts';

describe('Unit Conversion Utilities (All 14 Supported Units)', () => {
  describe('Velocity conversions (canonical: cm/s, baseline: 185.4)', () => {
    const canonical = 185.4;

    it('converts to mm/s (cm/s * 10)', () => {
      expect(convertVelocity(canonical, 'mm/s')).toBeCloseTo(1854, 4);
    });

    it('converts to cm/s (identity)', () => {
      expect(convertVelocity(canonical, 'cm/s')).toBe(185.4);
    });

    it('converts to m/s (cm/s / 100)', () => {
      expect(convertVelocity(canonical, 'm/s')).toBeCloseTo(1.854, 4);
    });

    it('converts to km/h (cm/s * 0.036)', () => {
      expect(convertVelocity(canonical, 'km/h')).toBeCloseTo(6.6744, 4);
    });

    it('converts to ft/s (cm/s * 0.03280839895)', () => {
      expect(convertVelocity(canonical, 'ft/s')).toBeCloseTo(6.082677, 4);
    });

    it('handles zero velocity across all units', () => {
      for (const unit of SUPPORTED_UNITS.velocity) {
        expect(convertVelocity(0, unit)).toBe(0);
        expect(toCanonicalVelocity(0, unit)).toBe(0);
      }
    });

    it('handles very small and very large velocity values', () => {
      expect(convertVelocity(0.001, 'mm/s')).toBeCloseTo(0.01, 5);
      expect(convertVelocity(10000, 'km/h')).toBeCloseTo(360, 4);
    });

    it('satisfies reversible round-trip conversion for all 5 velocity units', () => {
      const testValues = [0, 0.5, 185.4, 500, 1234.56];
      for (const val of testValues) {
        for (const unit of SUPPORTED_UNITS.velocity) {
          const converted = convertVelocity(val, unit);
          const restored = toCanonicalVelocity(converted, unit);
          expect(restored).toBeCloseTo(val, 4);
        }
      }
    });

    it('converts safely using convertMetricValue helper', () => {
      expect(convertMetricValue('velocity', 100, 'm/s')).toBeCloseTo(1, 4);
      expect(convertMetricValue('velocity', NaN, 'm/s')).toBe(0);
    });
  });

  describe('Pressure conversions (canonical: mbar, baseline: 1012)', () => {
    const canonical = 1012;

    it('converts to Pa (mbar * 100)', () => {
      expect(convertPressure(canonical, 'Pa')).toBeCloseTo(101200, 2);
    });

    it('converts to kPa (mbar * 0.1)', () => {
      expect(convertPressure(canonical, 'kPa')).toBeCloseTo(101.2, 3);
    });

    it('converts to mbar (identity)', () => {
      expect(convertPressure(canonical, 'mbar')).toBe(1012);
    });

    it('converts to bar (mbar / 1000)', () => {
      expect(convertPressure(canonical, 'bar')).toBeCloseTo(1.012, 4);
    });

    it('converts to psi (mbar * 0.0145037738)', () => {
      expect(convertPressure(canonical, 'psi')).toBeCloseTo(14.677819, 4);
    });

    it('converts to atm (mbar * 0.0009869233)', () => {
      expect(convertPressure(canonical, 'atm')).toBeCloseTo(0.998766, 4);
    });

    it('handles zero pressure across all units', () => {
      for (const unit of SUPPORTED_UNITS.pressure) {
        expect(convertPressure(0, unit)).toBe(0);
        expect(toCanonicalPressure(0, unit)).toBe(0);
      }
    });

    it('handles boundary and high operating range pressure values', () => {
      expect(convertPressure(500, 'bar')).toBeCloseTo(0.5, 4);
      expect(convertPressure(2000, 'kPa')).toBeCloseTo(200, 3);
    });

    it('satisfies reversible round-trip conversion for all 6 pressure units', () => {
      const testValues = [0, 50, 1012, 1013.25, 2500];
      for (const val of testValues) {
        for (const unit of SUPPORTED_UNITS.pressure) {
          const converted = convertPressure(val, unit);
          const restored = toCanonicalPressure(converted, unit);
          expect(restored).toBeCloseTo(val, 3);
        }
      }
    });

    it('converts safely using convertMetricValue helper', () => {
      expect(convertMetricValue('pressure', 1000, 'bar')).toBeCloseTo(1, 4);
      expect(convertMetricValue('pressure', NaN, 'bar')).toBe(0);
    });
  });

  describe('Temperature conversions (canonical: °C, baseline: 36.8)', () => {
    const canonical = 36.8;

    it('converts to °C (identity)', () => {
      expect(convertTemperature(canonical, '°C')).toBe(36.8);
    });

    it('converts to °F ((°C * 9/5) + 32)', () => {
      expect(convertTemperature(canonical, '°F')).toBeCloseTo(98.24, 2);
    });

    it('converts to K (°C + 273.15)', () => {
      expect(convertTemperature(canonical, 'K')).toBeCloseTo(309.95, 2);
    });

    it('handles zero degrees Celsius (freezing point of water)', () => {
      expect(convertTemperature(0, '°C')).toBe(0);
      expect(convertTemperature(0, '°F')).toBe(32);
      expect(convertTemperature(0, 'K')).toBe(273.15);
    });

    it('handles boiling point of water (100 °C = 212 °F = 373.15 K)', () => {
      expect(convertTemperature(100, '°F')).toBeCloseTo(212, 4);
      expect(convertTemperature(100, 'K')).toBeCloseTo(373.15, 4);
      expect(toCanonicalTemperature(212, '°F')).toBeCloseTo(100, 4);
      expect(toCanonicalTemperature(373.15, 'K')).toBeCloseTo(100, 4);
    });

    it('handles negative temperatures in Celsius correctly', () => {
      expect(convertTemperature(-40, '°F')).toBeCloseTo(-40, 2);
      expect(toCanonicalTemperature(-40, '°F')).toBeCloseTo(-40, 2);
      expect(convertTemperature(-273.15, 'K')).toBeCloseTo(0, 2);
      expect(toCanonicalTemperature(0, 'K')).toBeCloseTo(-273.15, 2);
    });

    it('satisfies reversible round-trip conversion for all 3 temperature units', () => {
      const testValues = [-273.15, -40, 0, 21.5, 36.8, 100, 500];
      for (const val of testValues) {
        for (const unit of SUPPORTED_UNITS.temperature) {
          const converted = convertTemperature(val, unit);
          const restored = toCanonicalTemperature(converted, unit);
          expect(restored).toBeCloseTo(val, 4);
        }
      }
    });

    it('converts safely using convertMetricValue helper', () => {
      expect(convertMetricValue('temperature', 0, '°F')).toBe(32);
      expect(convertMetricValue('temperature', NaN, '°F')).toBe(0);
    });
  });

  describe('formatMeasurement', () => {
    it('formats values according to unit precision specs', () => {
      expect(formatMeasurement(1.854, 'm/s')).toBe('1.854');
      expect(formatMeasurement(101.2, 'kPa')).toBe('101.20');
      expect(formatMeasurement(101200, 'Pa')).toBe('101200');
      expect(formatMeasurement(36.8, '°C')).toBe('36.8');
      expect(formatMeasurement(1.012, 'bar')).toBe('1.012');
      expect(formatMeasurement(0.998766, 'atm')).toBe('0.999');
      expect(formatMeasurement(14.6778, 'psi')).toBe('14.68');
      expect(formatMeasurement(6.6744, 'km/h')).toBe('6.67');
      expect(formatMeasurement(6.0827, 'ft/s')).toBe('6.08');
      expect(formatMeasurement(1854, 'mm/s')).toBe('1854');
    });

    it('handles invalid numbers safely', () => {
      expect(formatMeasurement(NaN, 'cm/s')).toBe('--');
      expect(formatMeasurement(Infinity, 'cm/s')).toBe('--');
      expect(formatMeasurement(-Infinity, 'cm/s')).toBe('--');
    });
  });

  describe('Fallback & Cross-conversion round-trips', () => {
    it('handles non-finite values by falling back to 0 across all inverse converters', () => {
      for (const unit of SUPPORTED_UNITS.velocity) {
        expect(toCanonicalVelocity(NaN, unit)).toBe(0);
        expect(toCanonicalVelocity(Infinity, unit)).toBe(0);
        expect(toCanonicalVelocity(-Infinity, unit)).toBe(0);
      }
      for (const unit of SUPPORTED_UNITS.pressure) {
        expect(toCanonicalPressure(NaN, unit)).toBe(0);
        expect(toCanonicalPressure(Infinity, unit)).toBe(0);
        expect(toCanonicalPressure(-Infinity, unit)).toBe(0);
      }
      for (const unit of SUPPORTED_UNITS.temperature) {
        expect(toCanonicalTemperature(NaN, unit)).toBe(0);
        expect(toCanonicalTemperature(Infinity, unit)).toBe(0);
        expect(toCanonicalTemperature(-Infinity, unit)).toBe(0);
      }
    });

    it('handles non-finite values by falling back to 0 across all forward converters', () => {
      for (const unit of SUPPORTED_UNITS.velocity) {
        expect(convertVelocity(NaN, unit)).toBe(0);
        expect(convertVelocity(Infinity, unit)).toBe(0);
        expect(convertVelocity(-Infinity, unit)).toBe(0);
      }
      for (const unit of SUPPORTED_UNITS.pressure) {
        expect(convertPressure(NaN, unit)).toBe(0);
        expect(convertPressure(Infinity, unit)).toBe(0);
        expect(convertPressure(-Infinity, unit)).toBe(0);
      }
      for (const unit of SUPPORTED_UNITS.temperature) {
        expect(convertTemperature(NaN, unit)).toBe(0);
        expect(convertTemperature(Infinity, unit)).toBe(0);
        expect(convertTemperature(-Infinity, unit)).toBe(0);
      }
    });

    it('supports direct unit-to-unit cross-conversion round-trips via canonical baseline', () => {
      // Velocity: km/h -> canonical (cm/s) -> ft/s -> canonical -> km/h
      const initialSpeedKmH = 100;
      const canonicalSpeed = toCanonicalVelocity(initialSpeedKmH, 'km/h');
      const speedFtS = convertVelocity(canonicalSpeed, 'ft/s');
      const canonicalSpeedRestored = toCanonicalVelocity(speedFtS, 'ft/s');
      const finalSpeedKmH = convertVelocity(canonicalSpeedRestored, 'km/h');
      expect(finalSpeedKmH).toBeCloseTo(initialSpeedKmH, 4);

      // Pressure: psi -> canonical (mbar) -> kPa -> canonical -> psi
      const initialPressurePsi = 14.7;
      const canonicalPressure = toCanonicalPressure(initialPressurePsi, 'psi');
      const pressureKPa = convertPressure(canonicalPressure, 'kPa');
      const canonicalPressureRestored = toCanonicalPressure(pressureKPa, 'kPa');
      const finalPressurePsi = convertPressure(canonicalPressureRestored, 'psi');
      expect(finalPressurePsi).toBeCloseTo(initialPressurePsi, 4);

      // Temperature: °F -> canonical (°C) -> K -> canonical -> °F
      const initialTempF = 98.6;
      const canonicalTemp = toCanonicalTemperature(initialTempF, '°F');
      const tempK = convertTemperature(canonicalTemp, 'K');
      const canonicalTempRestored = toCanonicalTemperature(tempK, 'K');
      const finalTempF = convertTemperature(canonicalTempRestored, '°F');
      expect(finalTempF).toBeCloseTo(initialTempF, 4);
    });
  });
});
