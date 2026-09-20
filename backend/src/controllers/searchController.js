const { query } = require("../db");
const { tokenize, normalizeQuery } = require("../search/tokenizer");
const { rankDocuments } = require("../search/ranking");
const { trie } = require("../search/trie");
const { findClosestTerms } = require("../search/levenshtein");
const { createSnippet } = require("../search/highlighter");

const search = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const {
      q = "",
      tag,
      author,
      from,
      to,
      page = 1,
      limit = 10,
      sort = "relevance",
    } = req.query;

    if (!q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const normalizedQuery = normalizeQuery(q);
    let queryTerms = tokenize(normalizedQuery);

    if (!queryTerms.length) {
      return res.json({
        success: true,
        query: q,
        correctedQuery: null,
        results: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          totalPages: 0,
        },
      });
    }

    const indexedTerms = new Set();

    const rankedResults = rankDocuments(normalizedQuery);

    for (const result of rankedResults) {
      const documentTerms = tokenize(`${result.title} ${result.body}`);

      for (const term of documentTerms) {
        indexedTerms.add(term);
      }
    }

    let correctedQuery = null;

    const correctedTerms = queryTerms.map((term) => {
      if (indexedTerms.has(term)) {
        return term;
      }

      const matches = findClosestTerms(
        term,
        Array.from(indexedTerms),
        2
      );

      return matches.length ? matches[0].term : term;
    });

    if (correctedTerms.join(" ") !== queryTerms.join(" ")) {
      correctedQuery = correctedTerms.join(" ");
      queryTerms = correctedTerms;
    }

    let results = rankDocuments(queryTerms.join(" "));

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
        tagResult.rows.map((row) => String(row.id))
      );

      results = results.filter((item) =>
        allowedIds.has(String(item.id))
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
        authorResult.rows.map((row) => String(row.id))
      );

      results = results.filter((item) =>
        allowedIds.has(String(item.id))
      );
    }

    if (from) {
      const dateResult = await query(
        `SELECT id
         FROM documents
         WHERE created_at >= $1`,
        [from]
      );

      const allowedIds = new Set(
        dateResult.rows.map((row) => String(row.id))
      );

      results = results.filter((item) =>
        allowedIds.has(String(item.id))
      );
    }

    if (to) {
      const dateResult = await query(
        `SELECT id
         FROM documents
         WHERE created_at <= $1`,
        [to]
      );

      const allowedIds = new Set(
        dateResult.rows.map((row) => String(row.id))
      );

      results = results.filter((item) =>
        allowedIds.has(String(item.id))
      );
    }

    if (sort === "date") {
      const dateResult = await query(
        `SELECT id, created_at
         FROM documents
         WHERE id = ANY($1::int[])`,
        [results.map((item) => item.id)]
      );

      const dates = new Map(
        dateResult.rows.map((row) => [
          String(row.id),
          new Date(row.created_at).getTime(),
        ])
      );

      results.sort(
        (a, b) =>
          (dates.get(String(b.id)) || 0) -
          (dates.get(String(a.id)) || 0)
      );
    }

    const total = results.length;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number(limit) || 10, 1),
      50
    );

    const offset = (pageNumber - 1) * pageSize;

    const paginatedResults = results
      .slice(offset, offset + pageSize)
      .map((item) => ({
        id: item.id,
        title: item.title,
        snippet: createSnippet(item.body, queryTerms),
        score: Number(item.score.toFixed(4)),
      }));

    const latency = Date.now() - startTime;

    await query(
      `INSERT INTO search_events
       (user_id, query, results_count, latency_ms)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user.id,
        q,
        total,
        latency,
      ]
    );

    res.json({
      success: true,
      query: q,
      correctedQuery,
      results: paginatedResults,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      latencyMs: latency,
    });
  } catch (error) {
    next(error);
  }
};

const suggest = async (req, res, next) => {
  try {
    const { prefix = "" } = req.query;

    if (!prefix.trim()) {
      return res.json({
        success: true,
        suggestions: [],
      });
    }

    const suggestions = trie.suggest(prefix, 5);

    res.json({
      success: true,
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