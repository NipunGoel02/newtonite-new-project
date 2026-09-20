const { getChannel, QUEUE_NAME } = require("./connection");

const publishIndexJob = async (documentId, action = "index") => {
  const channel = await getChannel();

  const message = {
    documentId,
    action,
    createdAt: new Date().toISOString(),
  };

  channel.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,
      contentType: "application/json",
    }
  );

  return message;
};

module.exports = {
  publishIndexJob,
};