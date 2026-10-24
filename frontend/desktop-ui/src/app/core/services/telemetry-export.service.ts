import { Injectable, inject } from '@angular/core';
import { TelemetrySessionService } from './telemetry-session.service';
import { DashboardFacadeService } from '../../features/dashboard/services/dashboard-facade.service';
import {
  convertVelocity,
  convertPressure,
  convertTemperature,
} from '../utilities/unit-conversion.util';
import { VelocityUnit, PressureUnit, TemperatureUnit } from 'telemetry-contracts';
import ExcelJS from 'exceljs';
import type { ExportRow } from '../interfaces';
import type { ExportStatus } from '../types';

export type { ExportRow, ExportStatus };

@Injectable({
  providedIn: 'root',
})
export class TelemetryExportService {
  private readonly sessionService = inject(TelemetrySessionService);
  private readonly facade = inject(DashboardFacadeService);

  /**
   * Prepares normalized export rows with user-selected units applied
   */
  prepareExportData(): {
    rows: ExportRow[];
    units: { velocity: VelocityUnit; pressure: PressureUnit; temperature: TemperatureUnit };
  } {
    const rawRecords = this.sessionService.records();
    const velUnit = this.facade.selectedVelocityUnit();
    const presUnit = this.facade.selectedPressureUnit();
    const tempUnit = this.facade.selectedTemperatureUnit();

    const rows: ExportRow[] = rawRecords.map((r) => ({
      timestamp: r.timestamp,
      velocity: Math.round(convertVelocity(r.velocity, velUnit) * 1000) / 1000,
      pressure: Math.round(convertPressure(r.pressure, presUnit) * 1000) / 1000,
      temperature: Math.round(convertTemperature(r.temperature, tempUnit) * 1000) / 1000,
    }));

    return {
      rows,
      units: {
        velocity: velUnit,
        pressure: presUnit,
        temperature: tempUnit,
      },
    };
  }

  /**
   * Generates standard RFC 4180 CSV string with timestamp, column headers and selected unit labels
   */
  generateCsvContent(
    rows: ExportRow[],
    units: { velocity: VelocityUnit; pressure: PressureUnit; temperature: TemperatureUnit },
  ): string {
    const headers = [
      'Timestamp (UTC)',
      `Velocity (${units.velocity})`,
      `Pressure (${units.pressure})`,
      `Temperature (${units.temperature})`,
    ];

    const lines: string[] = [headers.join(',')];

    for (const r of rows) {
      // Defend against CSV injection (=, +, -, @) and escape double quotes
      let safeTimestamp = r.timestamp.replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(safeTimestamp)) {
        safeTimestamp = `'${safeTimestamp}`;
      }

      const line = [
        `"${safeTimestamp}"`,
        r.velocity.toString(),
        r.pressure.toString(),
        r.temperature.toString(),
      ].join(',');
      lines.push(line);
    }

    return lines.join('\r\n');
  }

  /**
   * Generates a fully formatted Excel XLSX workbook binary buffer
   */
  async generateExcelBuffer(
    rows: ExportRow[],
    units: { velocity: VelocityUnit; pressure: PressureUnit; temperature: TemperatureUnit },
  ): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Telemetry Controller Monitor';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Telemetry Data', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'Timestamp (UTC)', key: 'timestamp', width: 28 },
      { header: `Velocity (${units.velocity})`, key: 'velocity', width: 18 },
      { header: `Pressure (${units.pressure})`, key: 'pressure', width: 18 },
      { header: `Temperature (${units.temperature})`, key: 'temperature', width: 18 },
    ];

    // Restrained, professional styling on header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;

    for (const r of rows) {
      const row = sheet.addRow({
        timestamp: r.timestamp,
        velocity: r.velocity,
        pressure: r.pressure,
        temperature: r.temperature,
      });
      // Right-align numeric telemetry data cells
      row.getCell('velocity').alignment = { horizontal: 'right' };
      row.getCell('pressure').alignment = { horizontal: 'right' };
      row.getCell('temperature').alignment = { horizontal: 'right' };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Exports session data as CSV via native Electron dialog or fallback web download
   */
  async exportCsv(): Promise<ExportStatus> {
    const { rows, units } = this.prepareExportData();
    if (rows.length === 0) return 'empty';

    const csvContent = this.generateCsvContent(rows, units);
    const filename = `telemetry-export-${this.formatDateForFilename(new Date())}.csv`;

    const desktopApi = typeof window !== 'undefined' ? window.telemetryDesktop : undefined;
    if (desktopApi?.showSaveDialog && desktopApi?.saveFile) {
      try {
        const filePath = await desktopApi.showSaveDialog({
          defaultPath: filename,
          filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        });
        if (!filePath) return 'cancelled';

        const success = await desktopApi.saveFile(filePath, csvContent);
        return success ? 'success' : 'error';
      } catch (err) {
        console.error('Electron native save error:', err);
        return 'error';
      }
    } else {
      // Browser environment fallback
      this.triggerBrowserDownload(csvContent, filename, 'text/csv;charset=utf-8;');
      return 'success';
    }
  }

  /**
   * Exports session data as Excel XLSX via native Electron dialog or fallback web download
   */
  async exportExcel(): Promise<ExportStatus> {
    const { rows, units } = this.prepareExportData();
    if (rows.length === 0) return 'empty';

    try {
      const buffer = await this.generateExcelBuffer(rows, units);
      const filename = `telemetry-export-${this.formatDateForFilename(new Date())}.xlsx`;

      const desktopApi = typeof window !== 'undefined' ? window.telemetryDesktop : undefined;
      if (desktopApi?.showSaveDialog && desktopApi?.saveFile) {
        const filePath = await desktopApi.showSaveDialog({
          defaultPath: filename,
          filters: [{ name: 'Excel Workbooks', extensions: ['xlsx'] }],
        });
        if (!filePath) return 'cancelled';

        const success = await desktopApi.saveFile(filePath, buffer);
        return success ? 'success' : 'error';
      } else {
        // Browser environment fallback (create fresh ArrayBuffer copy to guarantee strict ArrayBuffer BlobPart and handle byte offsets)
        const copy = new Uint8Array(buffer.byteLength);
        copy.set(buffer);
        const blob = new Blob([copy.buffer as ArrayBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return 'success';
      }
    } catch (err) {
      console.error('Excel generation/save error:', err);
      return 'error';
    }
  }

  private formatDateForFilename(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  }

  private triggerBrowserDownload(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
