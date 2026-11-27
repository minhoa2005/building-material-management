import express from "express";
// Must load before any route module so mount paths are recorded for the API catalogue.
import "./shared/utils/routeRegistry.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { ApiError } from "./shared/utils/ApiError.js";
import { requestMetrics } from "./modules/system/monitor.service.js";
import morgan from "morgan";

// Excel imports (up to 1,000 rows per sheet) exceed the 1 MB default; every other route keeps it.
export const IMPORT_BODY_LIMIT = "8mb";
const IMPORT_PATHS = new Set([
  "/api/products/import/preview",
  "/api/products/import",
  "/api/opening-stocks/preview",
  "/api/opening-stocks",
]);

export function createApp({ logRequests = true, secureCookies = false } = {}) {
  const app = express();
  app.locals.secureCookies = secureCookies;

  app.use(cors({ origin: true, credentials: true }));
  const importJson = express.json({ limit: IMPORT_BODY_LIMIT });
  const json = express.json({ limit: "1mb" });
  app.use((req, res, next) =>
    (req.method === "POST" && IMPORT_PATHS.has(req.path.replace(/\/+$/, "")) ? importJson : json)(req, res, next));
  app.use(cookieParser());
  app.use(requestMetrics);
  if (logRequests) app.use(morgan("dev"));

  app.use("/api", apiRoutes);

  app.use((_req, _res, next) => {
    next(new ApiError(404, "Route not found"));
  });

  app.use(errorHandler);

  return app;
}

export default createApp();
