import { describe, it, expect, beforeEach } from 'vitest';
import { TelemetrySessionService } from './telemetry-session.service';
import { DashboardResponse } from 'telemetry-contracts';

describe('TelemetrySessionService', () => {
  let service: TelemetrySessionService;

  beforeEach(() => {
    service = new TelemetrySessionService();
  });

  const mockSnapshot = (timestamp: string, v: number, p: number, t: number): DashboardResponse => ({
    timestamp,
    velocity: {
      value: v,
      unit: 'cm/s',
      history: [{ time: '10:00:00', value: v, timestamp }],
    },
    pressure: {
      value: p,
      unit: 'mbar',
      history: [{ time: '10:00:00', value: p, timestamp }],
    },
    temperature: {
      value: t,
      unit: '°C',
      history: [{ time: '10:00:00', value: t, timestamp }],
    },
  });

  it('ingests snapshot and records aligned telemetry record', () => {
    service.ingestSnapshot(mockSnapshot('2026-07-22T10:00:00Z', 15.5, 1013.2, 36.5));
    const records = service.records();
    expect(records.length).toBe(1);
    expect(records[0].velocity).toBe(15.5);
    expect(records[0].pressure).toBe(1013.2);
    expect(records[0].temperature).toBe(36.5);
  });

  it('deduplicates overlapping samples with identical timestamp', () => {
    service.ingestSnapshot(mockSnapshot('2026-07-22T10:00:00Z', 15.5, 1013.2, 36.5));
    service.ingestSnapshot(mockSnapshot('2026-07-22T10:00:00Z', 15.5, 1013.2, 36.5));
    expect(service.records().length).toBe(1);
  });

  it('maintains chronological sorting across multiple timestamps', () => {
    service.ingestSnapshot(mockSnapshot('2026-07-22T10:00:05Z', 16.0, 1014.0, 37.0));
    service.ingestSnapshot(mockSnapshot('2026-07-22T10:00:01Z', 15.0, 1012.0, 36.0));

    const records = service.records();
    expect(records.length).toBe(2);
    expect(records[0].timestamp).toBe('2026-07-22T10:00:01Z');
    expect(records[1].timestamp).toBe('2026-07-22T10:00:05Z');
  });

  it('provides getRecordsCount() and clearSession() functionality', () => {
    service.ingestSnapshot(mockSnapshot('2026-07-22T10:00:01Z', 15.0, 1012.0, 36.0));
    expect(service.getRecordsCount()).toBe(1);

    service.clearSession();
    expect(service.getRecordsCount()).toBe(0);
    expect(service.records()).toEqual([]);
  });

  it('safely ignores null or incomplete snapshot objects', () => {
    service.ingestSnapshot(null as any);
    expect(service.getRecordsCount()).toBe(0);

    service.ingestSnapshot({} as any);
    expect(service.getRecordsCount()).toBe(0);

    service.ingestSnapshot({
      timestamp: '2026-07-22T10:00:00Z',
      velocity: null,
      pressure: null,
      temperature: null,
    } as any);
    expect(service.getRecordsCount()).toBe(0);
  });

  it('enforces bounded memory retention when records count exceeds MAX_SESSION_RECORDS', () => {
    // Override MAX_SESSION_RECORDS for unit test boundary verification
    (service as any).MAX_SESSION_RECORDS = 5;

    for (let i = 1; i <= 8; i++) {
      service.ingestSnapshot(
        mockSnapshot(`2026-07-22T10:00:0${i}Z`, 10 + i, 1000 + i, 30 + i),
      );
    }

    expect(service.getRecordsCount()).toBe(5);
    // Oldest records (1, 2, 3) should have been truncated
    const timestamps = service.records().map((r) => r.timestamp);
    expect(timestamps).toEqual([
      '2026-07-22T10:00:04Z',
      '2026-07-22T10:00:05Z',
      '2026-07-22T10:00:06Z',
      '2026-07-22T10:00:07Z',
      '2026-07-22T10:00:08Z',
    ]);
  });
});
