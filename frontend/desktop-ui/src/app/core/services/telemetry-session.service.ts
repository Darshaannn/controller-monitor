import { Injectable, signal } from '@angular/core';
import { DashboardResponse } from 'telemetry-contracts';
import type { AlignedTelemetryRecord } from '../interfaces';

export type { AlignedTelemetryRecord };

@Injectable({
  providedIn: 'root',
})
export class TelemetrySessionService {
  // Maximum aligned samples retained in memory
  private readonly MAX_SESSION_RECORDS = 50000;

  // Primary in-memory chronological store
  private readonly recordsMap = new Map<string, AlignedTelemetryRecord>();
  readonly records = signal<readonly AlignedTelemetryRecord[]>([]);

  /**
   * Ingest a live API dashboard response, extracting the latest snapshot as well
   * as backfilling any historical points to ensure zero data gaps during transient drops.
   */
  ingestSnapshot(snapshot: DashboardResponse): void {
    if (!snapshot || !snapshot.velocity || !snapshot.pressure || !snapshot.temperature) return;

    let modified = false;

    // 1. Backfill from backend rolling history arrays
    const velHistory = snapshot.velocity.history ?? [];
    const presHistory = snapshot.pressure.history ?? [];
    const tempHistory = snapshot.temperature.history ?? [];

    const minLen = Math.min(velHistory.length, presHistory.length, tempHistory.length);
    for (let i = 0; i < minLen; i++) {
      const v = velHistory[i];
      const p = presHistory[i];
      const t = tempHistory[i];

      // Keying by ISO timestamp if available or synthetic ISO timestamp
      const key = v.timestamp || `${snapshot.timestamp.split('T')[0]}T${v.time}Z`;
      if (!this.recordsMap.has(key)) {
        this.recordsMap.set(key, {
          timestamp: key,
          time: v.time,
          velocity: v.value,
          pressure: p.value,
          temperature: t.value,
        });
        modified = true;
      }
    }

    // 2. Ingest the current authoritative snapshot sample
    const currentKey = snapshot.timestamp;
    if (!this.recordsMap.has(currentKey)) {
      const timeStr = new Date(snapshot.timestamp).toISOString().substring(11, 19);
      this.recordsMap.set(currentKey, {
        timestamp: currentKey,
        time: timeStr,
        velocity: snapshot.velocity.value,
        pressure: snapshot.pressure.value,
        temperature: snapshot.temperature.value,
      });
      modified = true;
    }

    if (modified) {
      // Enforce bounded memory retention
      if (this.recordsMap.size > this.MAX_SESSION_RECORDS) {
        const excess = this.recordsMap.size - this.MAX_SESSION_RECORDS;
        const keysIterator = this.recordsMap.keys();
        for (let i = 0; i < excess; i++) {
          const oldestKey = keysIterator.next().value;
          if (oldestKey) {
            this.recordsMap.delete(oldestKey);
          }
        }
      }

      // Convert Map to chronological sorted array
      const sorted = Array.from(this.recordsMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      this.records.set(sorted);
    }
  }

  getRecordsCount(): number {
    return this.records().length;
  }

  clearSession(): void {
    this.recordsMap.clear();
    this.records.set([]);
  }
}
