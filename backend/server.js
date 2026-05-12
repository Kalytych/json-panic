require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const db = require("./db");

const authRoutes = require("./routes/authRoutes");
const levelRoutes = require("./routes/levelRoutes");
const gameRoutes = require("./routes/gameRoutes");
const serverRoutes = require("./routes/serverRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "home.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "JSON Panic",
    database: "connected"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});