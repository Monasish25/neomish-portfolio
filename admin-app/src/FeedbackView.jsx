import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Loader2, Star, AlertCircle, RefreshCw, Trash2, MessageSquare } from "lucide-react";
import BinView from "./BinView";

export default function FeedbackView({ onFeedbackRead }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState("active"); // "active" | "bin"
  const [filterRating, setFilterRating] = useState(0); // 0 means all ratings

  const filteredFeedbacks = filterRating === 0 
    ? feedbacks 
    : feedbacks.filter(fb => fb._rating === filterRating);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("project_type", "Feedback")
        .neq("status", "deleted")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Parse feedback-specific fields from the message body
      const parsed = (data || []).map((msg) => {
        let title = "Untitled Feedback";
        let rating = 0;
        let body = msg.message;

        // Extract title
        const titleMatch = msg.message.match(/^Title:\s*(.+)/m);
        if (titleMatch) title = titleMatch[1].trim();

        // Extract rating
        const ratingMatch = msg.message.match(/Rating:\s*(\d)\/5/);
        if (ratingMatch) rating = parseInt(ratingMatch[1]);

        // Extract body (everything after the metadata lines)
        const bodyMatch = msg.message.match(/Rating:\s*\d\/5\s*Stars\n\n([\s\S]*)/);
        if (bodyMatch) body = bodyMatch[1].trim();

        return { ...msg, _title: title, _rating: rating, _body: body };
      });

      setFeedbacks(parsed);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  };

  const handleFeedbackClick = async (fb) => {
    setSelectedFeedback(fb);
    setShowConfirm(false);
    if (fb.status === "new") {
      setFeedbacks((prev) => prev.map((f) => (f.id === fb.id ? { ...f, status: "read" } : f)));
      if (onFeedbackRead) onFeedbackRead();
      await supabase.from("messages").update({ status: "read" }).eq("id", fb.id);
    }
  };

  const handleBulkDeleteClick = () => {
    setShowBulkConfirm(true);
  };

  const executeBulkDelete = async () => {
    setDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    const { error } = await supabase.from("messages").update({ status: "deleted" }).in("id", idsToDelete);
    if (!error) {
      setFeedbacks((prev) => prev.filter((f) => !selectedIds.has(f.id)));
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
    } else {
      alert("Failed to delete feedbacks");
    }
    setDeleting(false);
  };

  const executeDelete = async (id) => {
    setDeleting(true);
    const { error } = await supabase.from("messages").update({ status: "deleted" }).eq("id", id);
    if (!error) {
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      setSelectedFeedback(null);
      setShowConfirm(false);
      if (selectedIds.has(id)) {
        const newSet = new Set(selectedIds);
        newSet.delete(id);
        setSelectedIds(newSet);
      }
    } else {
      alert("Failed to delete feedback");
    }
    setDeleting(false);
  };

  const renderStars = (rating) => (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={16}
          fill={rating >= s ? "var(--primary, #48d8cc)" : "none"}
          color={rating >= s ? "var(--primary, #48d8cc)" : "var(--ink-dim, #666)"}
        />
      ))}
    </div>
  );

  if (viewMode === "bin") {
    return <BinView type="feedback" onBack={() => setViewMode("active")} />;
  }

  return (
    <div className="messages-view">
      <div className="messages-header">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h2>
            <Star size={20} />
            Feedback ({filteredFeedbacks.length})
          </h2>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDeleteClick}
              disabled={deleting}
              className="project-delete"
              title="Delete selected feedback"
              style={{ padding: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}
            >
              {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <select 
            value={filterRating} 
            onChange={(e) => setFilterRating(Number(e.target.value))}
            style={{ padding: "6px 12px", background: "var(--bg)", color: "#fff", border: "1px solid var(--line)", borderRadius: "6px", fontSize: "14px" }}
          >
            <option value={0} style={{ background: "#000", color: "#fff" }}>All Ratings</option>
            <option value={5} style={{ background: "#000", color: "#fff" }}>5 Stars</option>
            <option value={4} style={{ background: "#000", color: "#fff" }}>4 Stars</option>
            <option value={3} style={{ background: "#000", color: "#fff" }}>3 Stars</option>
            <option value={2} style={{ background: "#000", color: "#fff" }}>2 Stars</option>
            <option value={1} style={{ background: "#000", color: "#fff" }}>1 Star</option>
          </select>
          <button onClick={() => setViewMode("bin")} className="dash-tab" title="View Bin" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={16} /> Bin
          </button>
          <button onClick={fetchFeedbacks} className="refresh-btn" disabled={loading} title="Refresh feedback">
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {showBulkConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "var(--panel)", padding: "24px", borderRadius: "12px", border: "1px solid var(--line)", maxWidth: "400px", width: "100%", textAlign: "left"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "18px" }}>Delete {selectedIds.size} feedback(s)?</h3>
            <p style={{ color: "var(--ink-dim)", marginBottom: "24px", fontSize: "14px" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setShowBulkConfirm(false)} className="dash-tab" disabled={deleting} style={{ padding: "8px 16px" }}>Cancel</button>
              <button onClick={executeBulkDelete} className="project-delete" disabled={deleting} style={{ padding: "8px 16px", width: "auto", display: "inline-flex", gap: "8px" }}>
                {deleting ? <Loader2 size={16} className="spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="dash-empty error">
          <AlertCircle size={24} />
          <p>Failed to load feedback: {error}</p>
        </div>
      ) : loading ? (
        <div className="dash-loading">
          <Loader2 size={24} className="spin" />
          Loading feedback…
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="dash-empty">
          <Star size={24} />
          <p>{feedbacks.length === 0 ? "No feedback yet. When someone submits feedback from the portfolio, it will appear here." : "No feedback found for the selected rating."}</p>
        </div>
      ) : selectedFeedback ? (
        <div className="message-detail-view">
          <button className="back-btn" onClick={() => setSelectedFeedback(null)}>
            ← Back to Feedback
          </button>
          <div className="message-detail-card">
            <div className="message-card-header">
              <div className="message-sender">
                <h3>{selectedFeedback._title}</h3>
                <span style={{ color: "var(--ink-dim)", fontSize: "14px" }}>
                  by {selectedFeedback.name}
                  {selectedFeedback.email && selectedFeedback.email !== "no-reply@portfolio.com" && (
                    <> · <a href={`mailto:${selectedFeedback.email}`}>{selectedFeedback.email}</a></>
                  )}
                </span>
              </div>
              <div className="message-meta">
                {renderStars(selectedFeedback._rating)}
                <span className="message-date">{formatDate(selectedFeedback.created_at)}</span>
              </div>
            </div>
            <div className="message-detail-body">
              <p style={{ wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "pre-wrap" }}>{selectedFeedback._body}</p>
            </div>
            <div className="message-detail-actions" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              {showConfirm ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", color: "var(--ink-dim)" }}>Delete this feedback?</span>
                  <button onClick={() => executeDelete(selectedFeedback.id)} disabled={deleting} className="project-delete" style={{ padding: "8px 16px", width: "auto", display: "inline-flex", gap: "8px" }}>
                    {deleting ? <Loader2 size={16} className="spin" /> : "Yes"}
                  </button>
                  <button onClick={() => setShowConfirm(false)} disabled={deleting} className="dash-tab" style={{ padding: "8px 16px" }}>
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="project-delete"
                  title="Delete feedback"
                  style={{ padding: "8px 16px", width: "auto", display: "inline-flex", gap: "8px" }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="messages-list">
          {filteredFeedbacks.map((fb) => (
            <div key={fb.id} className={`message-card ${fb.status === "new" ? "unread" : ""}`} onClick={() => handleFeedbackClick(fb)} style={{ cursor: "pointer" }}>
              <div className="message-card-header">
                <div className="message-sender">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(fb.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const newSet = new Set(selectedIds);
                        if (e.target.checked) newSet.add(fb.id);
                        else newSet.delete(fb.id);
                        setSelectedIds(newSet);
                      }}
                      style={{ cursor: "pointer", transform: "scale(1.2)" }}
                    />
                    {fb.status === "new" && <div className="unread-dot" />}
                    <h3>{fb._title}</h3>
                  </div>
                  <span style={{ color: "var(--ink-dim)", fontSize: "13px" }}>by {fb.name}</span>
                </div>
                <div className="message-meta">
                  {renderStars(fb._rating)}
                  <span className="message-date">{formatDate(fb.created_at)}</span>
                </div>
              </div>
              <div className="message-body snippet">
                <p>{fb._body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
