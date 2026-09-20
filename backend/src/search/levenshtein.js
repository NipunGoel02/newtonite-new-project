function levenshteinDistance(a = "", b = "") {
  a = a.toLowerCase();
  b = b.toLowerCase();

  const rows = a.length + 1;
  const cols = b.length + 1;

  const matrix = Array.from(
    { length: rows },
    () => new Array(cols).fill(0)
  );

  for (let i = 0; i < rows; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j < cols; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function findClosestTerms(term, terms, maxDistance = 2) {
  return terms
    .map((candidate) => ({
      term: candidate,
      distance: levenshteinDistance(term, candidate),
    }))
    .filter((item) => item.distance <= maxDistance)
    .sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }

      return a.term.localeCompare(b.term);
    });
}

module.exports = {
  levenshteinDistance,
  findClosestTerms,
};