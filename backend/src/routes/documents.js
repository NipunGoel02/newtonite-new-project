const express = require("express");
const { query } = require("../db");
const authenticate = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const router = express.Router();

router.post("/", authenticate, adminOnly, async (req, res, next) => {
  const client = await require("../db").pool.connect();

  try {
    const { title, body, tags = [] } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "Title and body are required",
      });
    }

    await client.query("BEGIN");

    const documentResult = await client.query(
      `INSERT INTO documents (title, body, author_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [title.trim(), body, req.user.id]
    );

    const document = documentResult.rows[0];

    for (const tagName of tags) {
      const tagResult = await client.query(
        `INSERT INTO tags (name)
         VALUES ($1)
         ON CONFLICT (name)
         DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [tagName.toLowerCase().trim()]
      );

      await client.query(
        `INSERT INTO document_tags (document_id, tag_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [document.id, tagResult.rows[0].id]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      document,
      message: "Document created and queued for indexing",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        d.id,
        d.title,
        d.body,
        d.status,
        d.created_at,
        d.updated_at,
        u.id AS author_id,
        u.name AS author_name,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', t.id,
              'name', t.name
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags
      FROM documents d
      JOIN users u ON u.id = d.author_id
      LEFT JOIN document_tags dt ON dt.document_id = d.id
      LEFT JOIN tags t ON t.id = dt.tag_id
      GROUP BY d.id, u.id
      ORDER BY d.created_at DESC
    `);

    res.json({
      success: true,
      documents: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `
      SELECT
        d.id,
        d.title,
        d.body,
        d.status,
        d.created_at,
        d.updated_at,
        u.id AS author_id,
        u.name AS author_name,
        u.email AS author_email,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', t.id,
              'name', t.name
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags
      FROM documents d
      JOIN users u ON u.id = d.author_id
      LEFT JOIN document_tags dt ON dt.document_id = d.id
      LEFT JOIN tags t ON t.id = dt.tag_id
      WHERE d.id = $1
      GROUP BY d.id, u.id
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      document: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticate, adminOnly, async (req, res, next) => {
  const client = await require("../db").pool.connect();

  try {
    const { title, body, tags = [] } = req.body;
    const documentId = req.params.id;

    await client.query("BEGIN");

    const documentResult = await client.query(
      `UPDATE documents
       SET title = COALESCE($1, title),
           body = COALESCE($2, body),
           status = 'pending',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [title, body, documentId]
    );

    if (documentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    await client.query(
      "DELETE FROM document_tags WHERE document_id = $1",
      [documentId]
    );

    for (const tagName of tags) {
      const tagResult = await client.query(
        `INSERT INTO tags (name)
         VALUES ($1)
         ON CONFLICT (name)
         DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [tagName.toLowerCase().trim()]
      );

      await client.query(
        `INSERT INTO document_tags (document_id, tag_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [documentId, tagResult.rows[0].id]
      );
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      document: documentResult.rows[0],
      message: "Document updated and queued for re-indexing",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

router.delete("/:id", authenticate, adminOnly, async (req, res, next) => {
  try {
    const result = await query(
      `DELETE FROM documents
       WHERE id = $1
       RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;