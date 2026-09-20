import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getSuggestions, searchDocuments } from "../services/search";
import Navbar from "../components/Navbar";

export default function Search() {
  const [query, setQuery] = useState("");
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [tag, setTag] = useState("");
  const [author, setAuthor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [error, setError] = useState("");
  const [correctedQuery, setCorrectedQuery] = useState(null);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const searchController = useRef(null);
  const suggestionController = useRef(null);
  const suggestionTimer = useRef(null);

  useEffect(() => {
    return () => {
      searchController.current?.abort();
      suggestionController.current?.abort();
      clearTimeout(suggestionTimer.current);
    };
  }, []);

  const loadSuggestions = (value) => {
    clearTimeout(suggestionTimer.current);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    suggestionTimer.current = setTimeout(async () => {
      suggestionController.current?.abort();

      const controller = new AbortController();
      suggestionController.current = controller;

      try {
        setSuggestLoading(true);

        const data = await getSuggestions(
          value.trim(),
          controller.signal
        );

        setSuggestions(data.suggestions || []);
        setActiveSuggestion(-1);
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setSuggestLoading(false);
      }
    }, 250);
  };

  const performSearch = async (
    searchQuery = input,
    page = 1
  ) => {
    if (!searchQuery.trim()) {
      setError("Enter something to search");
      return;
    }

    searchController.current?.abort();

    const controller = new AbortController();
    searchController.current = controller;

    try {
      setLoading(true);
      setError("");
      setSuggestions([]);

      const data = await searchDocuments(
        {
          q: searchQuery.trim(),
          tag: tag || undefined,
          author: author || undefined,
          from: from || undefined,
          to: to || undefined,
          page,
          limit: 10,
        },
        controller.signal
      );

      setQuery(data.query);
      setResults(data.results || []);
      setPagination(data.pagination);
      setCorrectedQuery(data.correctedQuery);
    } catch (err) {
      if (
        err.name !== "CanceledError" &&
        err.name !== "AbortError"
      ) {
        setError(
          err.response?.data?.message ||
            "Unable to search right now"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setInput(value);
    loadSuggestions(value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();

      setActiveSuggestion((current) =>
        current < suggestions.length - 1 ? current + 1 : 0
      );
      return;
    }

    if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();

      setActiveSuggestion((current) =>
        current > 0 ? current - 1 : suggestions.length - 1
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (activeSuggestion >= 0) {
        const selected = suggestions[activeSuggestion];
        setInput(selected);
        performSearch(selected, 1);
        return;
      }

      performSearch(input, 1);
    }

    if (event.key === "Escape") {
      setSuggestions([]);
      setActiveSuggestion(-1);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setSuggestions([]);
    performSearch(suggestion, 1);
  };

  const handleFilterSearch = () => {
    performSearch(query || input, 1);
  };

  const clearFilters = () => {
    setTag("");
    setAuthor("");
    setFrom("");
    setTo("");

    if (query || input) {
      setTimeout(() => {
        performSearch(query || input, 1);
      }, 0);
    }
  };

  const highlightHtml = (html) => ({
    __html: html,
  });

  return (
    <>
      <Navbar />

      <main className="search-page">
        <section className="search-header">
          <div>
            <h1>Search Knowledge Base</h1>
            <p>
              Find technical articles, guides, and engineering
              knowledge.
            </p>
          </div>

          <div className="search-box-wrapper">
            <div className="search-box">
              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Search articles..."
                aria-label="Search articles"
              />

              <button
                onClick={() => performSearch(input, 1)}
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    className={
                      index === activeSuggestion
                        ? "suggestion active"
                        : "suggestion"
                    }
                    onClick={() =>
                      handleSuggestionClick(suggestion)
                    }
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {suggestLoading && (
              <div className="suggestion-loading">
                Finding suggestions...
              </div>
            )}
          </div>
        </section>

        <section className="search-layout">
          <aside className="search-filters">
            <h3>Filters</h3>

            <label>Tag</label>
            <input
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="e.g. JavaScript"
            />

            <label>Author ID</label>
            <input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="e.g. 1"
            />

            <label>From</label>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />

            <label>To</label>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />

            <button
              className="filter-button"
              onClick={handleFilterSearch}
            >
              Apply Filters
            </button>

            <button
              className="clear-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </aside>

          <section className="search-results">
            <div className="results-topbar">
              <div>
                {query ? (
                  <>
                    <strong>{pagination.total}</strong> results
                    for <strong>"{query}"</strong>
                  </>
                ) : (
                  "Search results"
                )}
              </div>

              {correctedQuery && (
                <button
                  className="correction"
                  onClick={() =>
                    performSearch(correctedQuery, 1)
                  }
                >
                  Showing results for{" "}
                  <strong>{correctedQuery}</strong>
                </button>
              )}
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {loading && (
              <div className="search-loading">
                <div className="skeleton-card" />
                <div className="skeleton-card" />
                <div className="skeleton-card" />
              </div>
            )}

            {!loading &&
              !error &&
              results.length === 0 &&
              query && (
                <div className="empty-results">
                  <h2>No results found</h2>
                  <p>
                    Try a different keyword or remove some
                    filters.
                  </p>
                </div>
              )}

            {!loading &&
              results.map((result) => (
                <article className="result-card" key={result.id}>
                  <Link to={`/documents/${result.id}`}>
                    <h2
                      dangerouslySetInnerHTML={highlightHtml(
                        result.title
                      )}
                    />
                  </Link>

                  <p
                    dangerouslySetInnerHTML={highlightHtml(
                      result.snippet
                    )}
                  />

                  <div className="result-meta">
                    <span>Score: {result.score}</span>
                    <span>Document #{result.id}</span>
                  </div>
                </article>
              ))}

            {!loading && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    performSearch(
                      query || input,
                      pagination.page - 1
                    )
                  }
                >
                  Previous
                </button>

                <span>
                  Page {pagination.page} of{" "}
                  {pagination.totalPages}
                </span>

                <button
                  disabled={
                    pagination.page >= pagination.totalPages
                  }
                  onClick={() =>
                    performSearch(
                      query || input,
                      pagination.page + 1
                    )
                  }
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}