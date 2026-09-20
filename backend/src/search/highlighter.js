function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text = "", terms = []) {
  if (!text || !terms.length) {
    return text;
  }

  const validTerms = terms
    .filter(Boolean)
    .map((term) => escapeRegex(term))
    .sort((a, b) => b.length - a.length);

  if (!validTerms.length) {
    return text;
  }

  const pattern = new RegExp(`(${validTerms.join("|")})`, "gi");

  return text.replace(pattern, "<mark>$1</mark>");
}

function createSnippet(text = "", terms = [], maxLength = 220) {
  if (!text) {
    return "";
  }

  const normalizedTerms = terms
    .filter(Boolean)
    .map((term) => term.toLowerCase());

  const lowerText = text.toLowerCase();

  let matchPosition = -1;

  for (const term of normalizedTerms) {
    const position = lowerText.indexOf(term);

    if (position !== -1) {
      if (matchPosition === -1 || position < matchPosition) {
        matchPosition = position;
      }
    }
  }

  if (text.length <= maxLength) {
    return highlight(text, terms);
  }

  if (matchPosition === -1) {
    return `${text.slice(0, maxLength)}...`;
  }

  const contextBefore = 80;
  const start = Math.max(0, matchPosition - contextBefore);
  const end = Math.min(text.length, start + maxLength);

  let snippet = text.slice(start, end);

  if (start > 0) {
    snippet = `...${snippet}`;
  }

  if (end < text.length) {
    snippet = `${snippet}...`;
  }

  return highlight(snippet, terms);
}

module.exports = {
  highlight,
  createSnippet,
};