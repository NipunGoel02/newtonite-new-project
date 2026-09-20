class TrieNode {
  constructor() {
    this.children = new Map();
    this.isWord = false;
    this.frequency = 0;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word, frequency = 1) {
    if (!word) return;

    word = word.toLowerCase().trim();

    let current = this.root;

    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }

      current = current.children.get(char);
    }

    current.isWord = true;
    current.frequency += frequency;
  }

  findNode(prefix) {
    if (!prefix) return this.root;

    prefix = prefix.toLowerCase();

    let current = this.root;

    for (const char of prefix) {
      if (!current.children.has(char)) {
        return null;
      }

      current = current.children.get(char);
    }

    return current;
  }

  collectWords(node, prefix, results) {
    if (node.isWord) {
      results.push({
        word: prefix,
        frequency: node.frequency,
      });
    }

    for (const [char, child] of node.children) {
      this.collectWords(child, prefix + char, results);
    }
  }

  suggest(prefix, limit = 5) {
    prefix = prefix.toLowerCase().trim();

    if (!prefix) return [];

    const node = this.findNode(prefix);

    if (!node) return [];

    const results = [];

    this.collectWords(node, prefix, results);

    return results
      .sort((a, b) => {
        if (b.frequency !== a.frequency) {
          return b.frequency - a.frequency;
        }

        return a.word.localeCompare(b.word);
      })
      .slice(0, limit)
      .map((item) => item.word);
  }

  clear() {
    this.root = new TrieNode();
  }
}

const trie = new Trie();

module.exports = {
  Trie,
  TrieNode,
  trie,
};