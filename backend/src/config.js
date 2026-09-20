require("dotenv").config();

const config = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  redisUrl: process.env.REDIS_URL,
  rabbitmqUrl: process.env.RABBITMQ_URL,
  kafkaBroker: process.env.KAFKA_BROKER || "localhost:9092",
};

module.exports = config;