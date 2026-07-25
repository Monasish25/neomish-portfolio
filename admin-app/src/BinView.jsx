import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Loader2, Trash2, AlertCircle, RefreshCw, ArchiveRestore } from "lucide-react";

export default function BinView({ type = "messages", onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchBin = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("messages")
        .select("*")
        .eq("status", "deleted")
        .order("created_at", { ascending: false });

      if (type === "feedback") {
        query = query.eq("project_type", "Feedback");
      } else {
        query = query.neq("project_type", "Feedback");
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching bin:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBin();
  }, [type]);

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

  const handleBulkDeleteClick = () => {
    setShowBulkConfirm(true);
  };

  const executeBulkDelete = async () => {
    setDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    const { error } = await supabase.from("messages").delete().in("id", idsToDelete);
    if (!error) {
      setMessages((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
    } else {
      console.error("Error permanently deleting messages:", error);
      alert("Failed to permanently delete messages");
    }
    setDeleting(false);
  };

  const executeDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Permanently delete this message? This cannot be undone.")) return;
    setDeleting(true);
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedIds.has(id)) {
        const newSet = new Set(selectedIds);
        newSet.delete(id);
        setSelectedIds(newSet);
      }
    } else {
      console.error("Error permanently deleting message:", error);
      alert("Failed to permanently delete message");
    }
    setDeleting(false);
  };

  const executeRestore = async (id, e) => {
    e.stopPropagation();
    setRestoring(true);
    const { error } = await supabase.from("messages").update({ status: "read" }).eq("id", id);
    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedIds.has(id)) {
        const newSet = new Set(selectedIds);
        newSet.delete(id);
        setSelectedIds(newSet);
      }
    } else {
      console.error("Error restoring message:", error);
      alert("Failed to restore message");
    }
    setRestoring(false);
  };

  const handleBulkRestore = async () => {
    setRestoring(true);
    const idsToRestore = Array.from(selectedIds);
    const { error } = await supabase.from("messages").update({ status: "read" }).in("id", idsToRestore);
    if (!error) {
      setMessages((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
    } else {
      console.error("Error restoring messages:", error);
      alert("Failed to restore messages");
    }
    setRestoring(false);
  };

  return (
    <div className="messages-view">
      {onBack && (
        <button className="back-btn" onClick={onBack} style={{ marginBottom: "16px" }}>
          ← Back to {type === "feedback" ? "Feedback" : "Messages"}
        </button>
      )}
      <div className="messages-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2>
            <Trash2 size={20} />
            {type === "feedback" ? "Feedback Bin" : "Messages Bin"} ({messages.length})
          </h2>
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleBulkRestore}
                disabled={restoring || deleting}
                className="dash-tab"
                title="Restore selected items"
                style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', gap: '6px' }}
              >
                {restoring ? <Loader2 size={16} className="spin" /> : <ArchiveRestore size={16} />}
                Restore
              </button>
              <button
                onClick={handleBulkDeleteClick}
                disabled={deleting || restoring}
                className="project-delete"
                title="Permanently delete selected items"
                style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', gap: '6px' }}
              >
                {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                Delete Forever
              </button>
            </div>
          )}
        </div>
        <button onClick={fetchBin} className="refresh-btn" disabled={loading} title="Refresh bin">
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Refresh
        </button>
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
            <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "18px", color: "var(--flame)" }}>Permanently Delete {selectedIds.size} item(s)?</h3>
            <p style={{ color: "var(--ink-dim)", marginBottom: "24px", fontSize: "14px" }}>This action cannot be undone and these items will be lost forever.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setShowBulkConfirm(false)} className="dash-tab" disabled={deleting} style={{ padding: "8px 16px" }}>Cancel</button>
              <button onClick={executeBulkDelete} className="project-delete" disabled={deleting} style={{ padding: "8px 16px", width: "auto", display: "inline-flex", gap: "8px" }}>
                {deleting ? <Loader2 size={16} className="spin" /> : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="dash-empty error">
          <AlertCircle size={24} />
          <p>Failed to load bin: {error}</p>
        </div>
      ) : loading ? (
        <div className="dash-loading">
          <Loader2 size={24} className="spin" />
          Loading bin…
        </div>
      ) : messages.length === 0 ? (
        <div className="dash-empty">
          <Trash2 size={24} />
          <p>Bin is empty.</p>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map((msg) => (
            <div key={msg.id} className="message-card" style={{ cursor: 'default' }}>
              <div className="message-card-header">
                <div className="message-sender">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(msg.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedIds);
                        if (e.target.checked) newSet.add(msg.id);
                        else newSet.delete(msg.id);
                        setSelectedIds(newSet);
                      }}
                      style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                    <h3>{msg.name}</h3>
                  </div>
                  <a href={`mailto:${msg.email}`}>{msg.email}</a>
                </div>
                <div className="message-meta" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className="project-type-badge">{msg.project_type || "Message"}</span>
                  <span className="message-date">{formatDate(msg.created_at)}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={(e) => executeRestore(msg.id, e)} className="dash-tab" title="Restore" style={{ padding: '6px' }}>
                      <ArchiveRestore size={16} />
                    </button>
                    <button onClick={(e) => executeDelete(msg.id, e)} className="project-delete" title="Delete forever" style={{ padding: '6px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="message-body snippet">
                <p>{msg.project_type === "Feedback" ? msg.message.replace(/^Title:.*?\n|Rating:.*?\n\n/gs, "") : msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
