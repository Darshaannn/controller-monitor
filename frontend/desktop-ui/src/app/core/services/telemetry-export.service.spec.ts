import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TelemetryExportService, ExportStatus } from './telemetry-export.service';
import { TelemetrySessionService } from './telemetry-session.service';
import { DashboardFacadeService } from '../../features/dashboard/services/dashboard-facade.service';
import { AlignedTelemetryRecord } from '../models';
import ExcelJS from 'exceljs';

describe('TelemetryExportService - Success, Failure, and Electron Scenarios', () => {
  let service: TelemetryExportService;
  let sessionService: TelemetrySessionService;
  let facadeService: DashboardFacadeService;

  const sampleRecords: AlignedTelemetryRecord[] = [
    {
      timestamp: '2026-10-16T12:00:00.000Z',
      time: '12:00:00',
      velocity: 185.4,
      pressure: 1012,
      temperature: 36.8,
    },
    {
      timestamp: '2026-10-16T12:00:01.000Z',
      time: '12:00:01',
      velocity: 190.2,
      pressure: 1015.5,
      temperature: 37.1,
    },
  ];

  beforeEach(() => {
    delete window.telemetryDesktop;

    TestBed.configureTestingModule({
      providers: [TelemetryExportService, TelemetrySessionService, DashboardFacadeService],
    });

    service = TestBed.inject(TelemetryExportService);
    sessionService = TestBed.inject(TelemetrySessionService);
    facadeService = TestBed.inject(DashboardFacadeService);
  });

  afterEach(() => {
    delete window.telemetryDesktop;
    vi.restoreAllMocks();
  });

  describe('CSV Generation & Export Scenarios', () => {
    it('returns "empty" status without generating file when session has no records', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue([]);

      const status = await service.exportCsv();
      expect(status).toBe('empty');
    });

    it('generates valid RFC 4180 CSV formatted content with correct headers and sanitized values', () => {
      const units = {
        velocity: 'cm/s' as const,
        pressure: 'mbar' as const,
        temperature: '°C' as const,
      };
      const rows = [
        { timestamp: '2026-10-16T12:00:00Z', velocity: 185.4, pressure: 1012, temperature: 36.8 },
        {
          timestamp: '=HYPERLINK("http://evil.com")',
          velocity: 100,
          pressure: 1000,
          temperature: 20,
        },
      ];

      const csv = service.generateCsvContent(rows, units);
      const lines = csv.split('\r\n');

      expect(lines[0]).toBe('Timestamp (UTC),Velocity (cm/s),Pressure (mbar),Temperature (°C)');
      expect(lines[1]).toBe('"2026-10-16T12:00:00Z",185.4,1012,36.8');
      // Defends against CSV injection by prepending single quote to formulas starting with =
      expect(lines[2]).toContain("'=HYPERLINK");
    });

    it('exports CSV via Electron bridge when saveDialog succeeds and saveFile succeeds', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue(sampleRecords);

      const mockSaveDialog = vi.fn().mockResolvedValue('C:\\exports\\telemetry.csv');
      const mockSaveFile = vi.fn().mockResolvedValue(true);

      window.telemetryDesktop = {
        showSaveDialog: mockSaveDialog,
        saveFile: mockSaveFile,
        getApiEndpoint: vi.fn(),
        getAppVersion: vi.fn(),
      };

      const result = await service.exportCsv();

      expect(result).toBe('success');
      expect(mockSaveDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        }),
      );
      expect(mockSaveFile).toHaveBeenCalledWith('C:\\exports\\telemetry.csv', expect.any(String));
    });

    it('returns "cancelled" status without reporting failure when user cancels the save dialog', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue(sampleRecords);

      const mockSaveDialog = vi.fn().mockResolvedValue(null); // User clicked Cancel
      const mockSaveFile = vi.fn();

      window.telemetryDesktop = {
        showSaveDialog: mockSaveDialog,
        saveFile: mockSaveFile,
        getApiEndpoint: vi.fn(),
        getAppVersion: vi.fn(),
      };

      const result = await service.exportCsv();

      expect(result).toBe('cancelled');
      expect(mockSaveFile).not.toHaveBeenCalled();
    });

    it('returns "error" status when Electron native saveFile returns false or rejects', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue(sampleRecords);

      const mockSaveDialog = vi.fn().mockResolvedValue('C:\\exports\\telemetry.csv');
      const mockSaveFile = vi.fn().mockResolvedValue(false); // Filesystem error (e.g. write protected)

      window.telemetryDesktop = {
        showSaveDialog: mockSaveDialog,
        saveFile: mockSaveFile,
        getApiEndpoint: vi.fn(),
        getAppVersion: vi.fn(),
      };

      const result = await service.exportCsv();
      expect(result).toBe('error');
    });

    it('handles unexpected thrown exceptions in Electron bridge and returns "error"', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue(sampleRecords);

      const mockSaveDialog = vi.fn().mockRejectedValue(new Error('IPC channel crashed'));

      window.telemetryDesktop = {
        showSaveDialog: mockSaveDialog,
        saveFile: vi.fn(),
        getApiEndpoint: vi.fn(),
        getAppVersion: vi.fn(),
      };

      const result = await service.exportCsv();
      expect(result).toBe('error');
    });

    it('falls back seamlessly to browser file download when desktop Electron API is not available', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue(sampleRecords);
      delete window.telemetryDesktop;

      const triggerDownloadSpy = vi
        .spyOn(service as unknown as { triggerBrowserDownload: (...args: unknown[]) => void }, 'triggerBrowserDownload')
        .mockImplementation(() => {});

      const result = await service.exportCsv();

      expect(result).toBe('success');
      expect(triggerDownloadSpy).toHaveBeenCalledWith(
        expect.stringContaining('Timestamp (UTC)'),
        expect.stringMatching(/^telemetry-export-.*\.csv$/),
        'text/csv;charset=utf-8;',
      );
    });
  });

  describe('Excel (.xlsx) Generation & Export Scenarios', () => {
    it('returns "empty" status without generating workbook when session is empty', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue([]);

      const status = await service.exportExcel();
      expect(status).toBe('empty');
    });

    it('generates a valid, readable ExcelJS workbook buffer with headers and aligned data', async () => {
      const units = {
        velocity: 'm/s' as const,
        pressure: 'kPa' as const,
        temperature: '°F' as const,
      };
      const rows = [
        { timestamp: '2026-10-16T12:00:00Z', velocity: 1.854, pressure: 101.2, temperature: 98.24 },
      ];

      const uint8 = await service.generateExcelBuffer(rows, units);
      expect(uint8).toBeInstanceOf(Uint8Array);
      expect(uint8.byteLength).toBeGreaterThan(0);

      // Verify that the generated binary buffer can be parsed back by ExcelJS
      const reader = new ExcelJS.Workbook();
      await reader.xlsx.load(uint8.buffer as ArrayBuffer);
      const sheet = reader.getWorksheet('Telemetry Data');
      expect(sheet).toBeDefined();
      expect(sheet?.rowCount).toBe(2); // 1 header row + 1 data row

      // Check header values
      const headerRow = sheet?.getRow(1);
      expect(headerRow?.getCell(1).value).toBe('Timestamp (UTC)');
      expect(headerRow?.getCell(2).value).toBe('Velocity (m/s)');
      expect(headerRow?.getCell(3).value).toBe('Pressure (kPa)');
      expect(headerRow?.getCell(4).value).toBe('Temperature (°F)');

      // Check data row values
      const dataRow = sheet?.getRow(2);
      expect(dataRow?.getCell(1).value).toBe('2026-10-16T12:00:00Z');
      expect(dataRow?.getCell(2).value).toBe(1.854);
      expect(dataRow?.getCell(3).value).toBe(101.2);
      expect(dataRow?.getCell(4).value).toBe(98.24);
    });

    it('exports Excel via Electron save dialog and saves binary buffer', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue(sampleRecords);

      const mockSaveDialog = vi.fn().mockResolvedValue('C:\\exports\\telemetry.xlsx');
      const mockSaveFile = vi.fn().mockResolvedValue(true);

      window.telemetryDesktop = {
        showSaveDialog: mockSaveDialog,
        saveFile: mockSaveFile,
        getApiEndpoint: vi.fn(),
        getAppVersion: vi.fn(),
      };

      const result = await service.exportExcel();
      expect(result).toBe('success');
      expect(mockSaveFile).toHaveBeenCalledWith(
        'C:\\exports\\telemetry.xlsx',
        expect.any(Uint8Array),
      );
    });

    it('returns "cancelled" status when user dismisses the Excel save dialog', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue(sampleRecords);

      const mockSaveDialog = vi.fn().mockResolvedValue(null);
      const mockSaveFile = vi.fn();

      window.telemetryDesktop = {
        showSaveDialog: mockSaveDialog,
        saveFile: mockSaveFile,
        getApiEndpoint: vi.fn(),
        getAppVersion: vi.fn(),
      };

      const result = await service.exportExcel();
      expect(result).toBe('cancelled');
      expect(mockSaveFile).not.toHaveBeenCalled();
    });

    it('returns "error" status when native saving of Excel fails', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue(sampleRecords);

      const mockSaveDialog = vi.fn().mockResolvedValue('C:\\exports\\telemetry.xlsx');
      const mockSaveFile = vi.fn().mockResolvedValue(false);

      window.telemetryDesktop = {
        showSaveDialog: mockSaveDialog,
        saveFile: mockSaveFile,
        getApiEndpoint: vi.fn(),
        getAppVersion: vi.fn(),
      };

      const result = await service.exportExcel();
      expect(result).toBe('error');
    });

    it('handles unexpected thrown exceptions in Electron bridge during Excel save and returns "error"', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue(sampleRecords);

      const mockSaveDialog = vi.fn().mockRejectedValue(new Error('IPC channel crashed during Excel save'));

      window.telemetryDesktop = {
        showSaveDialog: mockSaveDialog,
        saveFile: vi.fn(),
        getApiEndpoint: vi.fn(),
        getAppVersion: vi.fn(),
      };

      const result = await service.exportExcel();
      expect(result).toBe('error');
    });

    it('falls back seamlessly to browser Blob download when desktop Electron API is not available', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue(sampleRecords);
      delete window.telemetryDesktop;

      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/test-blob');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const result = await service.exportExcel();

      expect(result).toBe('success');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });

    it('catches and handles workbook generation failures gracefully', async () => {
      vi.spyOn(sessionService, 'records').mockReturnValue(sampleRecords);
      vi.spyOn(service, 'generateExcelBuffer').mockRejectedValueOnce(
        new Error('Out of memory generating workbook'),
      );

      const result = await service.exportExcel();
      expect(result).toBe('error');
    });
  });
});
