const { tokenize } = require("./tokenizer");
const { invertedIndex } = require("./invertedIndex");

const K1 = 1.5;
const B = 0.75;
const TITLE_BOOST = 3;

function calculateAverageLength(field) {
  const documents = invertedIndex.getAllDocuments();

  if (!documents.length) return 0;

  const total = documents.reduce((sum, doc) => {
    return sum + (field === "title" ? doc.titleLength : doc.bodyLength);
  }, 0);

  return total / documents.length;
}

function calculateBM25(term, documentId, field) {
  const postings = invertedIndex.getPostings(term);
  const posting = postings.get(documentId);

  if (!posting) return 0;

  const document = invertedIndex.getDocument(documentId);
  const totalDocuments = invertedIndex.size;
  const documentFrequency = invertedIndex.getDocumentFrequency(term);

  if (!document || !totalDocuments) return 0;

  const documentLength =
    field === "title" ? document.titleLength : document.bodyLength;

  const averageLength = calculateAverageLength(field) || 1;

  const idf = Math.log(
    1 +
      (totalDocuments - documentFrequency + 0.5) /
        (documentFrequency + 0.5)
  );

  const tf = posting.termFrequency;

  const denominator =
    tf +
    K1 *
      (1 - B + B * (documentLength / averageLength));

  return idf * ((tf * (K1 + 1)) / denominator);
}

function scoreDocument(documentId, queryTerms) {
  let score = 0;

  for (const term of queryTerms) {
    score += calculateBM25(term, documentId, "body");

    const titleScore = calculateBM25(term, documentId, "title");

    score += titleScore * TITLE_BOOST;
  }

  return score;
}

function rankDocuments(query) {
  const queryTerms = tokenize(query);

  if (!queryTerms.length) {
    return [];
  }

  const documentIds = new Set();

  for (const term of queryTerms) {
    const postings = invertedIndex.getPostings(term);

    for (const documentId of postings.keys()) {
      documentIds.add(documentId);
    }
  }

  return Array.from(documentIds)
    .map((documentId) => {
      const document = invertedIndex.getDocument(documentId);

      return {
        ...document,
        score: scoreDocument(documentId, queryTerms),
      };
    })
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  rankDocuments,
  scoreDocument,
};