const { query } = require("../db");
const { invertedIndex } = require("./invertedIndex");
const { trie } = require("./trie");
const { tokenize } = require("./tokenizer");

const loadSearchIndex = async () => {
  const result = await query(`
    SELECT
      d.id,
      d.title,
      d.body,
      COALESCE(
        STRING_AGG(t.name, ', ' ORDER BY t.name),
        ''
      ) AS tags
    FROM documents d
    LEFT JOIN document_tags dt
      ON dt.document_id = d.id
    LEFT JOIN tags t
      ON t.id = dt.tag_id
    GROUP BY d.id
    ORDER BY d.id
  `);

  invertedIndex.clear();
  trie.clear();

  for (const document of result.rows) {
    invertedIndex.addDocument({
      id: document.id,
      title: document.title,
      body: document.body,
    });

    const terms = tokenize(
      `${document.title} ${document.body}`
    );

    for (const term of terms) {
      trie.insert(term);
    }
  }

  console.log(
    `Search index loaded: ${result.rows.length} documents`
  );

  return result.rows.length;
};

module.exports = {
  loadSearchIndex,
};