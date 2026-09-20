const { Pool } = require("pg");

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