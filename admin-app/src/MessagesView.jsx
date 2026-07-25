import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Loader2, Mail, MessageSquare, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import BinView from "./BinView";

export default function MessagesView({ onMessageRead }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [viewMode, setViewMode] = useState("active"); // "active" | "bin"

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .neq("project_type", "Feedback")
        .neq("status", "deleted")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
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

  const handleMessageClick = async (msg) => {
    setSelectedMessage(msg);
    setShowConfirm(false);
    if (msg.status === "new") {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m)));
      if (onMessageRead) onMessageRead();
      await supabase.from("messages").update({ status: "read" }).eq("id", msg.id);
    }
  };

  const handleBulkDeleteClick = () => {
    setShowBulkConfirm(true);
  };

  const executeBulkDelete = async () => {
    setDeleting(true);
    const idsToDelete = Array.from(selectedMessageIds);
    const { error } = await supabase.from("messages").update({ status: "deleted" }).in("id", idsToDelete);
    if (!error) {
      setMessages((prev) => prev.filter((m) => !selectedMessageIds.has(m.id)));
      setSelectedMessageIds(new Set());
      setShowBulkConfirm(false);
    } else {
      console.error("Error deleting messages:", error);
      alert("Failed to delete messages");
    }
    setDeleting(false);
  };

  const executeDelete = async (id) => {
    setDeleting(true);
    const { error } = await supabase.from("messages").update({ status: "deleted" }).eq("id", id);
    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setSelectedMessage(null);
      setShowConfirm(false);
      // Remove from selected list if it was selected
      if (selectedMessageIds.has(id)) {
        const newSet = new Set(selectedMessageIds);
        newSet.delete(id);
        setSelectedMessageIds(newSet);
      }
    } else {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
    setDeleting(false);
  };

  if (viewMode === "bin") {
    return <BinView type="messages" onBack={() => setViewMode("active")} />;
  }

  return (
    <div className="messages-view">
      <div className="messages-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2>
            <MessageSquare size={20} />
            Messages ({messages.length})
          </h2>
          {selectedMessageIds.size > 0 && (
            <button
              onClick={handleBulkDeleteClick}
              disabled={deleting}
              className="project-delete"
              title="Delete selected messages"
              style={{ padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
            >
              {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setViewMode("bin")} className="dash-tab" title="View Bin" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={16} /> Bin
          </button>
          <button onClick={fetchMessages} className="refresh-btn" disabled={loading} title="Refresh messages">
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
            <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "18px" }}>Delete {selectedMessageIds.size} message(s)?</h3>
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
          <p>Failed to load messages: {error}</p>
        </div>
      ) : loading ? (
        <div className="dash-loading">
          <Loader2 size={24} className="spin" />
          Loading messages…
        </div>
      ) : messages.length === 0 ? (
        <div className="dash-empty">
          <Mail size={24} />
          <p>No messages yet. When someone submits the contact form, it will appear here.</p>
        </div>
      ) : selectedMessage ? (
        <div className="message-detail-view">
          <button className="back-btn" onClick={() => setSelectedMessage(null)}>
            ← Back to Messages
          </button>
          <div className="message-detail-card">
            <div className="message-card-header">
              <div className="message-sender">
                <h3>{selectedMessage.name}</h3>
                <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>
              </div>
              <div className="message-meta">
                <span className="project-type-badge">{selectedMessage.project_type}</span>
                <span className="message-date">{formatDate(selectedMessage.created_at)}</span>
              </div>
            </div>
            <div className="message-detail-body">
              <p style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{selectedMessage.message}</p>
            </div>
            <div className="message-detail-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a href={`mailto:${selectedMessage.email}`} className="dash-tab active" style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}>
                <Mail size={16} /> Reply
              </a>
              {showConfirm ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--ink-dim)' }}>Delete this message?</span>
                  <button onClick={() => executeDelete(selectedMessage.id)} disabled={deleting} className="project-delete" style={{ padding: '8px 16px', width: 'auto', display: 'inline-flex', gap: '8px' }}>
                    {deleting ? <Loader2 size={16} className="spin" /> : "Yes"}
                  </button>
                  <button onClick={() => setShowConfirm(false)} disabled={deleting} className="dash-tab" style={{ padding: '8px 16px' }}>
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="project-delete"
                  title="Delete message"
                  style={{ padding: '8px 16px', width: 'auto', display: 'inline-flex', gap: '8px' }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-card ${msg.status === 'new' ? 'unread' : ''}`} onClick={() => handleMessageClick(msg)} style={{ cursor: 'pointer' }}>
              <div className="message-card-header">
                <div className="message-sender">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedMessageIds.has(msg.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const newSet = new Set(selectedMessageIds);
                        if (e.target.checked) newSet.add(msg.id);
                        else newSet.delete(msg.id);
                        setSelectedMessageIds(newSet);
                      }}
                      style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                    {msg.status === 'new' && <div className="unread-dot" />}
                    <h3>{msg.name}</h3>
                  </div>
                  <a href={`mailto:${msg.email}`}>{msg.email}</a>
                </div>
                <div className="message-meta">
                  <span className="project-type-badge">{msg.project_type}</span>
                  <span className="message-date">{formatDate(msg.created_at)}</span>
                </div>
              </div>
              <div className="message-body snippet">
                <p>{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
