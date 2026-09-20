import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

export default function Document() {
  const { id } = useParams();

  const [document, setDocument] = useState(null);
  const [relatedDocuments, setRelatedDocuments] = useState([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/documents/${id}`);
        setDocument(response.data.document);

        try {
          const bookmarkResponse = await api.get(`/bookmarks/${id}`);
          setBookmarked(Boolean(bookmarkResponse.data.bookmarked));
        } catch {
          setBookmarked(false);
        }

        try {
          const relatedResponse = await api.get(`/documents/${id}/related`);
          setRelatedDocuments(relatedResponse.data.documents || []);
        } catch {
          setRelatedDocuments([]);
        }
      } catch (error) {
        setError(
          error.response?.data?.message || "Failed to load document"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [id]);

  const toggleBookmark = async () => {
    try {
      setBookmarkLoading(true);

      const response = await api.post("/bookmarks/toggle", {
        documentId: Number(id),
      });

      setBookmarked(response.data.bookmarked);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to update bookmark"
      );
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="document-page">
        <div className="document-skeleton">
          <div className="skeleton-line large"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-block"></div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="document-page">
        <div className="document-error">
          <h2>Document unavailable</h2>
          <p>{error || "Document not found"}</p>
          <Link to="/search">Back to Search</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="document-page">
      <div className="document-topbar">
        <Link to="/search" className="back-link">
          ← Back to Search
        </Link>

        <button
          className={`bookmark-button ${bookmarked ? "active" : ""}`}
          onClick={toggleBookmark}
          disabled={bookmarkLoading}
        >
          {bookmarkLoading
            ? "Saving..."
            : bookmarked
            ? "★ Bookmarked"
            : "☆ Bookmark"}
        </button>
      </div>

      <article className="document-card">
        <div className="document-meta">
          <span className="document-status">
            {document.status || "indexed"}
          </span>

          {document.created_at && (
            <span>
              {new Date(document.created_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <h1>{document.title}</h1>

        {document.author_name && (
          <p className="document-author">
            By {document.author_name}
          </p>
        )}

        {document.tags?.length > 0 && (
          <div className="document-tags">
            {document.tags.map((tag) => (
              <span key={tag.id || tag.name}>{tag.name}</span>
            ))}
          </div>
        )}

        <div className="document-body">
          {document.body
            ?.split("\n")
            .map((paragraph, index) =>
              paragraph.trim() ? (
                <p key={index}>{paragraph}</p>
              ) : null
            )}
        </div>
      </article>

      {relatedDocuments.length > 0 && (
        <section className="related-section">
          <div className="related-header">
            <h2>Related Documents</h2>
            <p>More knowledge related to this topic</p>
          </div>

          <div className="related-grid">
            {relatedDocuments.map((item) => (
              <Link
                key={item.id}
                to={`/documents/${item.id}`}
                className="related-card"
              >
                <h3>{item.title}</h3>

                <p>
                  {item.body?.slice(0, 120)}
                  {item.body?.length > 120 ? "..." : ""}
                </p>

                <span>{item.shared_tags} shared tags →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}