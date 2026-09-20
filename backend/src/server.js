const express = require("express");
const cors = require("cors");
const config = require("./config");

const app = express();

app.use(cors());
app.use(express.json());

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