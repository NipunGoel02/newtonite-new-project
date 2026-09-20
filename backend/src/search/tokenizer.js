const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "if",
  "then",
  "else",
  "for",
  "of",
  "to",
  "in",
  "on",
  "at",
  "by",
  "with",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "into",
  "about",
  "can",
  "could",
  "should",
  "would",
  "will",
  "you",
  "your",
  "we",
  "our",
  "they",
  "their"
]);

function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !STOP_WORDS.has(word));
}

function normalizeQuery(text = "") {
  return tokenize(text).join(" ");
}

module.exports = {
  tokenize,
  normalizeQuery,
  STOP_WORDS
};