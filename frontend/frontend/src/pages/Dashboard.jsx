import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function Dashboard() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const response = await api.get("/bookmarks");
        setBookmarks(response.data.bookmarks || []);
      } catch {
        setBookmarks([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  return (
    <>
      <Navbar />

      <main className="dashboard-page">
        <section className="dashboard-header">
          <div>
            <p className="dashboard-label">SEARCHHUB</p>
            <h1>Your Knowledge Dashboard</h1>
            <p>
              Search technical knowledge, manage bookmarks and
              discover trending content.
            </p>
          </div>

          <Link to="/search" className="dashboard-search-button">
            Start Searching
          </Link>
        </section>

        <section className="dashboard-stats">
          <div className="stat-card">
            <span>Bookmarks</span>
            <strong>{loading ? "—" : bookmarks.length}</strong>
            <small>Saved articles</small>
          </div>

          <div className="stat-card">
            <span>Search Engine</span>
            <strong>BM25</strong>
            <small>Relevance ranking</small>
          </div>

          <div className="stat-card">
            <span>Documents</span>
            <strong>500+</strong>
            <small>Knowledge articles</small>
          </div>

          <div className="stat-card">
            <span>Search</span>
            <strong>Live</strong>
            <small>Real-time results</small>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-panel">
            <div className="panel-header">
              <div>
                <h2>Recent Bookmarks</h2>
                <p>Your saved knowledge</p>
              </div>

              <Link to="/search">Explore</Link>
            </div>

            {loading ? (
              <div className="dashboard-loading">
                Loading bookmarks...
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="dashboard-empty">
                <h3>No bookmarks yet</h3>
                <p>
                  Save useful articles from the document page.
                </p>
              </div>
            ) : (
              <div className="bookmark-list">
                {bookmarks.slice(0, 5).map((bookmark) => (
                  <Link
                    key={bookmark.id}
                    to={`/documents/${bookmark.id}`}
                    className="bookmark-item"
                  >
                    <div>
                      <h3>{bookmark.title}</h3>
                      <p>
                        {bookmark.body?.slice(0, 100)}
                        {bookmark.body?.length > 100 ? "..." : ""}
                      </p>
                    </div>

                    <span>→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-panel">
            <div className="panel-header">
              <div>
                <h2>Quick Actions</h2>
                <p>Jump into SearchHub</p>
              </div>
            </div>

            <div className="quick-actions">
              <Link to="/search">
                <strong>Search Articles</strong>
                <span>Find knowledge using BM25 search</span>
              </Link>

              <Link to="/search">
                <strong>Explore Topics</strong>
                <span>Filter articles by tags</span>
              </Link>

              <Link to="/search">
                <strong>Autocomplete</strong>
                <span>Get instant search suggestions</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}