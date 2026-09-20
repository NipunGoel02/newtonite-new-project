const { query, pool } = require("../db");

const createDocument = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { title, body, tags = [] } = req.body;

    if (!title?.trim() || !body?.trim()) {
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
      [title.trim(), body.trim(), req.user.id]
    );

    const document = documentResult.rows[0];

    for (const tagName of tags) {
      if (!tagName?.trim()) continue;

      const tagResult = await client.query(
        `INSERT INTO tags (name)
         VALUES ($1)
         ON CONFLICT (name)
         DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [tagName.trim().toLowerCase()]
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
      message: "Document created",
      document,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
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
       ORDER BY d.created_at DESC`
    );

    res.json({
      success: true,
      documents: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const getDocument = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
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
       GROUP BY d.id, u.id`,
      [req.params.id]
    );

    if (!result.rows.length) {
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
};
const getRelatedDocuments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
        d.id,
        d.title,
        d.body,
        d.status,
        d.created_at,
        u.name AS author_name,
        COUNT(DISTINCT dt2.tag_id) AS shared_tags
       FROM documents d
       JOIN users u ON u.id = d.author_id
       JOIN document_tags dt2 ON dt2.document_id = d.id
       WHERE d.id != $1
         AND dt2.tag_id IN (
           SELECT tag_id
           FROM document_tags
           WHERE document_id = $1
         )
       GROUP BY d.id, u.name
       ORDER BY shared_tags DESC, d.created_at DESC
       LIMIT 5`,
      [req.params.id]
    );

    res.json({
      success: true,
      documents: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const updateDocument = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { title, body, tags = [] } = req.body;

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and body are required",
      });
    }

    await client.query("BEGIN");

    const documentResult = await client.query(
      `UPDATE documents
       SET title = $1,
           body = $2,
           status = 'pending',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [title.trim(), body.trim(), req.params.id]
    );

    if (!documentResult.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    await client.query(
      `DELETE FROM document_tags
       WHERE document_id = $1`,
      [req.params.id]
    );

    for (const tagName of tags) {
      if (!tagName?.trim()) continue;

      const tagResult = await client.query(
        `INSERT INTO tags (name)
         VALUES ($1)
         ON CONFLICT (name)
         DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [tagName.trim().toLowerCase()]
      );

      await client.query(
        `INSERT INTO document_tags (document_id, tag_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [req.params.id, tagResult.rows[0].id]
      );
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Document updated",
      document: documentResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const result = await query(
      `DELETE FROM documents
       WHERE id = $1
       RETURNING id`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      message: "Document deleted",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocument,
  getRelatedDocuments,
  updateDocument,
  deleteDocument,
};