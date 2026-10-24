// Vercel Serverless Function entrypoint
const { createApp, DEFAULT_TELEMETRY_CONFIG } = require("../backend/api/dist/app");

// Initialize application singleton with default telemetry configuration
const { app, simulatorService } = createApp(DEFAULT_TELEMETRY_CONFIG);

// Ensure simulator engine is ticking for telemetry updates
simulatorService.start();

module.exports = (req, res) => {
  return app(req, res);
};
