import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import taskRoutes from "./routes/taskRoutes";
import { authenticate } from "./middleware/authMiddleware";

dotenv.config();

const app = express();

app.use(express.json());

/* ---------- ROUTES ---------- */

// Auth routes
app.use("/auth", authRoutes);

// Task routes (protected)
app.use("/tasks", taskRoutes);

// Test protected route
app.get("/protected", authenticate, (req, res) => {
  res.json({ message: "You are authorized " });
});

/* ---------- DEFAULT ---------- */

app.get("/", (req, res) => {
  res.send("Backend is running ");
});

/* ---------- SERVER ---------- */

app.listen(5000, () => {
  console.log("Server running on port 5000");
});