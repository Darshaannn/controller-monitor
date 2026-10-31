import {
  convertVelocity,
  convertPressure,
  convertTemperature,
} from "@/lib/unit-conversion";
import {
  VelocityUnit,
  PressureUnit,
  TemperatureUnit,
  AlignedTelemetryRecord,
} from "@/types/telemetry";
import ExcelJS from "exceljs";

export interface ExportRow {
  readonly timestamp: string;
  readonly velocity: number;
  readonly pressure: number;
  readonly temperature: number;
}

export function prepareExportData(
  records: readonly AlignedTelemetryRecord[],
  velUnit: VelocityUnit,
  presUnit: PressureUnit,
  tempUnit: TemperatureUnit,
): {
  rows: ExportRow[];
  units: { velocity: VelocityUnit; pressure: PressureUnit; temperature: TemperatureUnit };
} {
  const rows: ExportRow[] = records.map((r) => ({
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

export function generateCsvContent(
  rows: ExportRow[],
  units: { velocity: VelocityUnit; pressure: PressureUnit; temperature: TemperatureUnit },
): string {
  const headers = [
    "Timestamp (UTC)",
    `Velocity (${units.velocity})`,
    `Pressure (${units.pressure})`,
    `Temperature (${units.temperature})`,
  ];

  const lines: string[] = [headers.join(",")];

  for (const r of rows) {
    let safeTimestamp = r.timestamp.replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(safeTimestamp)) {
      safeTimestamp = `'${safeTimestamp}`;
    }

    const line = [
      `"${safeTimestamp}"`,
      r.velocity.toString(),
      r.pressure.toString(),
      r.temperature.toString(),
    ].join(",");
    lines.push(line);
  }

  return lines.join("\r\n");
}

export async function generateExcelBuffer(
  rows: ExportRow[],
  units: { velocity: VelocityUnit; pressure: PressureUnit; temperature: TemperatureUnit },
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Telemetry Controller Monitor";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Telemetry Data", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Timestamp (UTC)", key: "timestamp", width: 28 },
    { header: `Velocity (${units.velocity})`, key: "velocity", width: 18 },
    { header: `Pressure (${units.pressure})`, key: "pressure", width: 18 },
    { header: `Temperature (${units.temperature})`, key: "temperature", width: 20 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F2B48" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 24;

  for (const r of rows) {
    const row = sheet.addRow({
      timestamp: r.timestamp,
      velocity: r.velocity,
      pressure: r.pressure,
      temperature: r.temperature,
    });
    row.getCell("velocity").numFmt = "#,##0.00";
    row.getCell("pressure").numFmt = "#,##0.00";
    row.getCell("temperature").numFmt = "#,##0.00";
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

export function triggerBrowserDownload(
  data: string | Uint8Array,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
