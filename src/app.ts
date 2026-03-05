import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import routes from "./routes";
import { handleStripeWebhook } from "./webhooks/stripe.webhook";
import { env } from "./env";

dotenv.config();

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(
  compression({
    threshold: 1024,
  })
);
app.post("/api/v1/webhooks/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(
  morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
    // Logging only error responses avoids heavy console I/O on hot endpoints.
    skip: (req, res) => req.path === "/api/v1/health" || res.statusCode < 400,
  })
);

const openapiPath = path.join(__dirname, "..", "docs", "openapi.yaml");
const openapiDocument = YAML.load(openapiPath);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.use("/api/v1", routes);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "PetConnect API is running" });
});

// basic global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err?.status || 500).json({
    success: false,
    message: err?.message || "Internal Server Error",
  });
});

export default app;
