import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import { connectDb } from "./config/db.config";
import {
  auditLogsRoutes,
  inventoryRoutes,
  productRoutes,
  reportRoutes,
  rolesRoutes,
  settingsRoutes,
  supplierRoutes,
  userRoutes,
  customerRoutes,
} from "./routes";
import cors from "cors";

const app: Application = express();
const port = process.env.PORT || 5000;

connectDb();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// connecting to the db
connectDb();

// Test route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Crystal Stock Keeper API",
    version: "1.0.0",
    status: "running",
  });
});

// routes
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/roles", rolesRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/logs", auditLogsRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/reports", reportRoutes);

// starting a server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
