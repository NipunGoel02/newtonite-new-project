const { tokenize } = require("./tokenizer");

class InvertedIndex {
  constructor() {
    this.index = new Map();
    this.documents = new Map();
  }

  addDocument(document) {
    const { id, title = "", body = "" } = document;

    this.removeDocument(id);

    const titleTokens = tokenize(title);
    const bodyTokens = tokenize(body);

    this.documents.set(id, {
      id,
      title,
      body,
      titleLength: titleTokens.length,
      bodyLength: bodyTokens.length,
    });

    const addTokens = (tokens, field) => {
      const frequencies = new Map();

      for (const token of tokens) {
        frequencies.set(token, (frequencies.get(token) || 0) + 1);
      }

      for (const [term, frequency] of frequencies) {
        if (!this.index.has(term)) {
          this.index.set(term, new Map());
        }

        this.index.get(term).set(id, {
          termFrequency: frequency,
          field,
        });
      }
    };

    addTokens(titleTokens, "title");
    addTokens(bodyTokens, "body");
  }

  removeDocument(documentId) {
    this.documents.delete(documentId);

    for (const [term, postings] of this.index.entries()) {
      postings.delete(documentId);

      if (postings.size === 0) {
        this.index.delete(term);
      }
    }
  }

  getPostings(term) {
    return this.index.get(term) || new Map();
  }

  getDocument(documentId) {
    return this.documents.get(documentId);
  }

  getAllDocuments() {
    return Array.from(this.documents.values());
  }

  hasTerm(term) {
    return this.index.has(term);
  }

  getDocumentFrequency(term) {
    const postings = this.index.get(term);
    return postings ? postings.size : 0;
  }

  get size() {
    return this.documents.size;
  }

  clear() {
    this.index.clear();
    this.documents.clear();
  }
}

const invertedIndex = new InvertedIndex();

module.exports = {
  InvertedIndex,
  invertedIndex,
};