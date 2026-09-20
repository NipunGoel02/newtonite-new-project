const express = require("express");
const authenticate = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const { publishDocumentIndexJob } = require("../rabbitmq/publisher");

const {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
} = require("../controllers/documentController");

const router = express.Router();

router.get("/", authenticate, getDocuments);

router.get("/:id", authenticate, getDocument);

router.post("/", authenticate, adminOnly, async (req, res, next) => {
  try {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      if (data.success && data.document?.id) {
        try {
          await publishDocumentIndexJob(data.document.id);
        } catch (error) {
          console.error("Failed to queue indexing job:", error.message);
        }
      }

      return originalJson(data);
    };

    await createDocument(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticate, adminOnly, async (req, res, next) => {
  try {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      if (data.success && data.document?.id) {
        try {
          await publishDocumentIndexJob(data.document.id);
        } catch (error) {
          console.error("Failed to queue indexing job:", error.message);
        }
      }

      return originalJson(data);
    };

    await updateDocument(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authenticate, adminOnly, deleteDocument);

module.exports = router;