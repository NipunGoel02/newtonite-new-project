const express = require("express");
const cors = require("cors");
const config = require("./config");
const { loadSearchIndex } = require("./search/indexLoader");

const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const bookmarkRoutes = require("./routes/bookmarks");
const searchRoutes = require("./routes/search");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
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

const startServer = async () => {
  try {
    await loadSearchIndex();

    app.listen(config.port, () => {
      console.log(`SearchHub API running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();