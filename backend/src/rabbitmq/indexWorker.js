const { getChannel, QUEUE_NAME } = require("../src/rabbitmq/connection");
const { query } = require("../src/db");
const { invertedIndex } = require("../src/search/invertedIndex");
const { trie } = require("../src/search/trie");
const { tokenize } = require("../src/search/tokenizer");

const MAX_RETRIES = 3;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const indexDocument = async (documentId) => {
  const result = await query(
    SELECT id, title, body
     FROM documents
     WHERE id = $1,
    [documentId]
  );

  if (!result.rows.length) {
    throw new Error("Document not found");
  }

  const document = result.rows[0];

  invertedIndex.addDocument(document);

  const terms = tokenize(
    ${document.title} ${document.body}
  );

  for (const term of terms) {
    trie.insert(term);
  }

  await query(
    UPDATE documents
     SET status = 'indexed',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1,
    [documentId]
  );
};

const startWorker = async () => {
  const channel = await getChannel();

  console.log("Document indexing worker started");

  channel.consume(
    QUEUE_NAME,
    async (message) => {
      if (!message) return;

      let job;

      try {
        job = JSON.parse(message.content.toString());

        const documentId = job.documentId;
        const retryCount = Number(job.retryCount || 0);

        await indexDocument(documentId);

        channel.ack(message);

        console.log(
          Document ${documentId} indexed successfully
        );
      } catch (error) {
        console.error(
          "Indexing failed:",
          error.message
        );

        let retryCount = Number(job?.retryCount || 0);

        if (retryCount < MAX_RETRIES) {
          retryCount += 1;

          await sleep(1000 * Math.pow(2, retryCount));

          channel.sendToQueue(
            QUEUE_NAME,
            Buffer.from(
              JSON.stringify({
                ...job,
                retryCount,
              })
            ),
            {
              persistent: true,
            }
          );

          channel.ack(message);
        } else {
          if (job?.documentId) {
            await query(
              UPDATE documents
               SET status = 'failed',
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $1,
              [job.documentId]
            );
          }

          channel.ack(message);

          console.error(
            Document ${job?.documentId} moved to failed status
          );
        }
      }
    },
    {
      noAck: false,
    }
  );
};

startWorker().catch((error) => {
  console.error(
    "Worker startup failed:",
    error
  );

  process.exit(1);
});