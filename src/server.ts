import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import { connectDb } from "./config/db.config";
import {
  productRoutes,
  rolesRoutes,
  supplierRoutes,
  userRoutes,
} from "./routes";
import cors from "cors";
import customerRoutes from "./routes/customer.routes";

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
    message: "Jewelry E-Commerce API",
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

// starting a server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
