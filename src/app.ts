import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import routes from "./routes";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

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
