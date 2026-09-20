const amqp = require("amqplib");
const config = require("../config");

let connection;
let channel;

const QUEUE_NAME = "document_indexing";

const connectRabbitMQ = async () => {
  if (connection && channel) {
    return channel;
  }

  connection = await amqp.connect(config.rabbitmqUrl);

  channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  await channel.prefetch(1);

  connection.on("error", (error) => {
    console.error("RabbitMQ connection error:", error);
    connection = null;
    channel = null;
  });

  connection.on("close", () => {
    connection = null;
    channel = null;
  });

  return channel;
};

const getChannel = async () => {
  if (!channel) {
    await connectRabbitMQ();
  }

  return channel;
};

module.exports = {
  connectRabbitMQ,
  getChannel,
  QUEUE_NAME,
};