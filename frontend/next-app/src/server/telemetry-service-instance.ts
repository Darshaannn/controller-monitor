import { createDefaultTelemetryConfig } from "./telemetry-config";
import { TelemetryStateService } from "./telemetry-state.service";
import { TelemetrySimulatorService } from "./telemetry-simulator.service";

declare global {
  // eslint-disable-next-line no-var
  var __telemetryStateService: TelemetryStateService | undefined;
  // eslint-disable-next-line no-var
  var __telemetrySimulatorService: TelemetrySimulatorService | undefined;
}

export function getTelemetryServices() {
  if (!global.__telemetryStateService || !global.__telemetrySimulatorService) {
    const config = createDefaultTelemetryConfig();
    const stateService = new TelemetryStateService(config);
    const simulatorService = new TelemetrySimulatorService(config, stateService);

    simulatorService.start();

    global.__telemetryStateService = stateService;
    global.__telemetrySimulatorService = simulatorService;
  }

  return {
    stateService: global.__telemetryStateService,
    simulatorService: global.__telemetrySimulatorService,
  };
}
