const { query } = require("../db");
const { tokenize, normalizeQuery } = require("../search/tokenizer");
const { invertedIndex } = require("../search/invertedIndex");
const { rankDocuments } = require("../search/ranking");
const { findClosestTerms } = require("../search/levenshtein");
const { createSnippet } = require("../search/highlighter");
const { trie } = require("../search/trie");

const search = async (req, res, next) => {
  try {
    const start = Date.now();

    const {
      q,
      tag,
      author,
      from,
      to,
      page = 1,
      limit = 10,
    } = req.query;

    if (!q || !String(q).trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query cannot be empty",
      });
    }

    const normalizedQuery = normalizeQuery(String(q));

    if (!normalizedQuery) {
      return res.status(400).json({
        success: false,
        message: "Search query cannot be empty",
      });
    }

    let searchTerms = tokenize(normalizedQuery);

    const allTerms = new Set(invertedIndex.index.keys());

    const correctedTerms = [];
    let hasCorrection = false;

    for (const term of searchTerms) {
      if (invertedIndex.hasTerm(term)) {
        correctedTerms.push(term);
        continue;
      }

      const closest = findClosestTerms(
        term,
        Array.from(allTerms),
        2
      );

      if (closest.length > 0) {
        correctedTerms.push(closest[0].term);
        hasCorrection = true;
      } else {
        correctedTerms.push(term);
      }
    }

    searchTerms = correctedTerms;

    const ranked = rankDocuments(searchTerms.join(" "));

    let results = ranked;

    if (tag) {
      const tagResult = await query(
        `SELECT DISTINCT d.id
         FROM documents d
         JOIN document_tags dt ON dt.document_id = d.id
         JOIN tags t ON t.id = dt.tag_id
         WHERE LOWER(t.name) = LOWER($1)`,
        [tag]
      );

      const allowedIds = new Set(
        tagResult.rows.map((row) => row.id)
      );

      results = results.filter((doc) =>
        allowedIds.has(doc.id)
      );
    }

    if (author) {
      const authorResult = await query(
        `SELECT id
         FROM documents
         WHERE author_id = $1`,
        [author]
      );

      const allowedIds = new Set(
        authorResult.rows.map((row) => row.id)
      );

      results = results.filter((doc) =>
        allowedIds.has(doc.id)
      );
    }

    if (from || to) {
      const dateResult = await query(
        `SELECT id
         FROM documents
         WHERE ($1::timestamp IS NULL OR created_at >= $1::timestamp)
         AND ($2::timestamp IS NULL OR created_at <= $2::timestamp)`,
        [from || null, to || null]
      );

      const allowedIds = new Set(
        dateResult.rows.map((row) => row.id)
      );

      results = results.filter((doc) =>
        allowedIds.has(doc.id)
      );
    }

    const total = results.length;

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const pageLimit = Math.min(
      Math.max(Number(limit) || 10, 1),
      50
    );

    const offset =
      (pageNumber - 1) * pageLimit;

    const paginatedResults = results
      .slice(offset, offset + pageLimit)
      .map((document) => ({
        id: document.id,
        title: createSnippet(
          document.title,
          searchTerms,
          160
        ),
        snippet: createSnippet(
          document.body,
          searchTerms,
          240
        ),
        score: Number(
          document.score.toFixed(4)
        ),
      }));

    const latencyMs = Date.now() - start;

    await query(
      `INSERT INTO search_events
       (user_id, query, results_count, latency_ms)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user.id,
        normalizedQuery,
        total,
        latencyMs,
      ]
    );

    res.json({
      success: true,
      query: normalizedQuery,
      correctedQuery: hasCorrection
        ? searchTerms.join(" ")
        : null,
      results: paginatedResults,
      pagination: {
        page: pageNumber,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(
          total / pageLimit
        ),
      },
      latencyMs,
    });
  } catch (error) {
    next(error);
  }
};

const suggest = async (req, res, next) => {
  try {
    const prefix = String(
      req.query.prefix || ""
    )
      .trim()
      .toLowerCase();

    if (!prefix) {
      return res.json({
        success: true,
        suggestions: [],
      });
    }

    const suggestions = trie.suggest(
      prefix,
      5
    );

    res.json({
      success: true,
      prefix,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  search,
  suggest,
};