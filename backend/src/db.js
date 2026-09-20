const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not loaded from .env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});

const query = (text, params) => {
  return pool.query(text, params);
};

module.exports = {
  pool,
  query,
};