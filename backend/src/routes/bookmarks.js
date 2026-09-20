const express = require("express");
const { query } = require("../db");
const authenticate = require("../middleware/auth");

const router = express.Router();

router.post("/:documentId", authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const document = await query(
      "SELECT id, title FROM documents WHERE id = $1",
      [documentId]
    );

    if (document.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const existing = await query(
      `SELECT user_id, document_id
       FROM bookmarks
       WHERE user_id = $1 AND document_id = $2`,
      [req.user.id, documentId]
    );

    if (existing.rows.length > 0) {
      await query(
        `DELETE FROM bookmarks
         WHERE user_id = $1 AND document_id = $2`,
        [req.user.id, documentId]
      );

      return res.json({
        success: true,
        bookmarked: false,
        message: "Bookmark removed",
      });
    }

    await query(
      `INSERT INTO bookmarks (user_id, document_id)
       VALUES ($1, $2)`,
      [req.user.id, documentId]
    );

    res.status(201).json({
      success: true,
      bookmarked: true,
      message: "Document bookmarked",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
        d.id,
        d.title,
        d.body,
        d.status,
        d.created_at,
        d.updated_at,
        b.created_at AS bookmarked_at
       FROM bookmarks b
       JOIN documents d ON d.id = b.document_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      bookmarks: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:documentId/status", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT EXISTS(
        SELECT 1
        FROM bookmarks
        WHERE user_id = $1 AND document_id = $2
      ) AS bookmarked`,
      [req.user.id, req.params.documentId]
    );

    res.json({
      success: true,
      bookmarked: result.rows[0].bookmarked,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;