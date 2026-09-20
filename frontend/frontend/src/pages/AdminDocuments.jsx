import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/documents");
      setDocuments(response.data.documents || []);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load documents"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setTags("");
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        title,
        body,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await api.put(`/documents/${editingId}`, payload);
        setMessage("Document updated successfully");
      } else {
        await api.post("/documents", payload);
        setMessage("Document created successfully");
      }

      resetForm();
      await loadDocuments();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to save document"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (document) => {
    setEditingId(document.id);
    setTitle(document.title);
    setBody(document.body);
    setTags(
      Array.isArray(document.tags)
        ? document.tags.map((tag) => tag.name).join(", ")
        : ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await api.delete(`/documents/${id}`);

      setMessage("Document deleted successfully");

      if (editingId === id) {
        resetForm();
      }

      await loadDocuments();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to delete document"
      );
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <Link to="/dashboard">← Dashboard</Link>
          <h1>Document Management</h1>
          <p>Create, update and manage knowledge-base documents.</p>
        </div>
      </div>

      <section className="admin-editor-card">
        <div className="admin-section-header">
          <h2>{editingId ? "Edit Document" : "Create Document"}</h2>

          {editingId && (
            <button
              type="button"
              className="secondary-button"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <label>Title</label>

          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter document title"
            required
          />

          <label>Tags</label>

          <input
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="javascript, react, backend"
          />

          <label>Markdown Content</label>

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="# Document title

Write your knowledge-base content here..."
            rows={16}
            required
          />

          <div className="markdown-preview">
            <h3>Preview</h3>
            <pre>{body || "Nothing to preview yet."}</pre>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Document"
                : "Create Document"}
          </button>
        </form>
      </section>

      <section className="admin-documents-section">
        <div className="admin-section-header">
          <h2>All Documents</h2>
          <span>{documents.length} documents</span>
        </div>

        {loading ? (
          <div className="admin-loading">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="admin-empty">
            No documents found.
          </div>
        ) : (
          <div className="admin-document-list">
            {documents.map((document) => (
              <article
                className="admin-document-card"
                key={document.id}
              >
                <div className="admin-document-content">
                  <div className="admin-document-top">
                    <span className={`status-badge ${document.status}`}>
                      {document.status}
                    </span>

                    <span>#{document.id}</span>
                  </div>

                  <h3>{document.title}</h3>

                  <p>
                    {document.body.length > 180
                      ? `${document.body.slice(0, 180)}...`
                      : document.body}
                  </p>

                  <div className="admin-document-tags">
                    {Array.isArray(document.tags) &&
                      document.tags.map((tag) => (
                        <span key={tag.id}>{tag.name}</span>
                      ))}
                  </div>
                </div>

                <div className="admin-document-actions">
                  <Link
                    to={`/documents/${document.id}`}
                    className="secondary-button"
                  >
                    View
                  </Link>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleEdit(document)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDelete(document.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}