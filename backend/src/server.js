const express = require("express");
const cors = require("cors");
const config = require("./config");
const authRoutes = require("./routes/auth");
const searchRoutes = require("./routes/search");
const documentRoutes = require("./routes/documents");
const bookmarkRoutes = require("./routes/bookmarks");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SearchHub API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/bookmarks", bookmarkRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.listen(config.port, () => {
  console.log(`SearchHub API running on port ${config.port}`);
});

app.use("/api/search", searchRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SearchHub API is running",
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.listen(config.port, () => {
  console.log(`SearchHub API running on port ${config.port}`);
});