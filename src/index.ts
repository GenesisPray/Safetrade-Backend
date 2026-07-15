import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import { tradesRouter } from "./routes/trades";
import { adminRouter } from "./routes/admin";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "SafeTrade API",
    version: "0.1.0",
    network: config.stellarNetwork,
    contractId: config.contractId || null,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/trades", tradesRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 SafeTrade API running on http://localhost:${config.port}`);
});

export default app;
