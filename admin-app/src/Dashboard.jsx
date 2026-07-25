import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import ProjectForm from "./ProjectForm";
import ActivitySidebar from "./ActivitySidebar";
import MessagesView from "./MessagesView";
import FeedbackView from "./FeedbackView";
import BinView from "./BinView";
import { logActivity } from "./activityLogger";
import { Trash2, LogOut, Film, AlertCircle, Loader2, Search, CheckCircle2, Bell, MessageSquare, Star } from "lucide-react";

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null); // project id being deleted
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActivity, setShowActivity] = useState(false);
  const [statusText, setStatusText] = useState("Open for work");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [activityUnreadCount, setActivityUnreadCount] = useState(0);

  useEffect(() => {
    fetchProjects();
    fetchUnreadMessages();

    const channel = supabase
      .channel('messages-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.status === 'new') {
            if (payload.new.project_type === 'Feedback') {
              setUnreadFeedbackCount((prev) => prev + 1);
            } else {
              setUnreadCount((prev) => prev + 1);
            }
            setActivityUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchUnreadMessages = async () => {
    if (!supabase) return;
    // Count unread non-feedback messages
    const { count: msgCount, error: msgError } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("status", "new")
      .neq("project_type", "Feedback");
    if (!msgError && msgCount !== null) {
      setUnreadCount(msgCount);
    }
    // Count unread feedback messages
    const { count: fbCount, error: fbError } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("status", "new")
      .eq("project_type", "Feedback");
    if (!fbError && fbCount !== null) {
      setUnreadFeedbackCount(fbCount);
    }
    setActivityUnreadCount((msgCount || 0) + (fbCount || 0));
  };

  const handleOpenActivity = async () => {
    setShowActivity(true);
    setActivityUnreadCount(0);
  };

  const fetchProjects = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProjects(data);
    }

    const { data: settingsData } = await supabase.from("settings").select("status_text").eq("id", 1).single();
    if (settingsData) setStatusText(settingsData.status_text);

    setLoading(false);
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatusText(newStatus);
    setUpdatingStatus(true);
    setStatusSuccess(false);
    try {
      const { data, error } = await supabase.from("settings").update({ status_text: newStatus }).eq("id", 1).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        alert("Failed to update: You do not have permission (RLS blocked the update). Please run the fix SQL script in Supabase.");
        setUpdatingStatus(false);
        return;
      }
      logActivity("Status Update", `Changed portfolio status to "${newStatus}"`);
      setStatusSuccess(true);
      setTimeout(() => setStatusSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (project) => {

    setDeleting(project.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Session expired. Please log in again.");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-video`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ project_id: project.id }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Delete failed");
      }

      // Remove from local state
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      logActivity("Delete", `Deleted project "${project.title}"`);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onLogout();
  };

  const handleUploaded = (newProject) => {
    if (newProject) {
      setProjects((prev) => [newProject, ...prev]);
    } else {
      fetchProjects(); // Refetch if we don't have the project data
    }
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard">
      {projectToDelete && (
        <div className="modal-backdrop" onClick={() => setProjectToDelete(null)} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)'}}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{background: 'var(--panel, #121212)', padding: '24px 32px', borderRadius: '16px', maxWidth: '440px', width: '90%', border: '1px solid var(--line, #333)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#ff4444'}}>
              <AlertCircle size={24} />
              <h3 style={{margin: 0, fontSize: '18px', color: '#fff'}}>Delete Project</h3>
            </div>
            <p style={{color: '#a0a0a0', lineHeight: 1.5, margin: '0 0 24px 0'}}>
              Are you sure you want to delete <strong>"{projectToDelete.title}"</strong>? This action cannot be undone and will permanently remove the video and all its metadata.
            </p>
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button 
                onClick={() => setProjectToDelete(null)} 
                disabled={deleting === projectToDelete.id}
                style={{padding: '10px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--line, #333)', color: '#fff', cursor: 'pointer'}}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(projectToDelete).then(() => setProjectToDelete(null))} 
                disabled={deleting === projectToDelete.id}
                style={{padding: '10px 16px', borderRadius: '8px', background: '#ff4444', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600}}
              >
                {deleting === projectToDelete.id ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                {deleting === projectToDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="dash-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div className="dash-logo">
            <span className="dash-dot" />
            <span>Neomish — Admin</span>
          </div>
          
          <div className="dash-tabs header-tabs">
            <button 
              className={`dash-tab ${activeTab === "projects" ? "active" : ""}`}
              onClick={() => setActiveTab("projects")}
            >
              <Film size={16} /> Projects
            </button>
            <button 
              className={`dash-tab ${activeTab === "messages" ? "active" : ""}`}
              onClick={() => setActiveTab("messages")}
              style={{ position: "relative" }}
            >
              <MessageSquare size={16} /> Messages
              {unreadCount > 0 && (
                <span className="unread-badge" style={{ right: "-4px", top: "-4px" }}>{unreadCount}</span>
              )}
            </button>
            <button 
              className={`dash-tab ${activeTab === "feedback" ? "active" : ""}`}
              onClick={() => setActiveTab("feedback")}
              style={{ position: "relative" }}
            >
              <Star size={16} /> Feedback
              {unreadFeedbackCount > 0 && (
                <span className="unread-badge" style={{ right: "-4px", top: "-4px" }}>{unreadFeedbackCount}</span>
              )}
            </button>
            <button 
              className={`dash-tab ${activeTab === "bin" ? "active" : ""}`}
              onClick={() => setActiveTab("bin")}
            >
              <Trash2 size={16} /> Bin
            </button>
          </div>
        </div>

        <div className="dash-user">
          <button onClick={handleOpenActivity} className="dash-alert" title="Activity Log" style={{ position: "relative" }}>
            <Bell size={16} />
            {activityUnreadCount > 0 && (
              <span className="unread-badge">{activityUnreadCount}</span>
            )}
          </button>
          <span className="dash-email">{user?.email}</span>
          <button onClick={handleLogout} className="dash-logout">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>

      <main className="dash-main">
        {activeTab === "projects" ? (
          <>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: 'var(--panel)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--line)'}}>
              <span style={{color: '#a0a0a0', fontSize: '14px', fontWeight: 500}}>Portfolio Status:</span>
              <select value={statusText} onChange={handleStatusChange} disabled={updatingStatus} style={{padding: '6px 12px', background: 'var(--bg)', color: '#fff', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '14px', minWidth: '200px'}}>
                <option value="Open for work" style={{background: '#000'}}>Open for work</option>
                <option value="Currently unavailable" style={{background: '#000'}}>Currently unavailable</option>
                <option value="Booking Q4 2026" style={{background: '#000'}}>Booking Q4 2026</option>
              </select>
              {updatingStatus ? (
                <Loader2 size={16} className="spin" style={{ color: "var(--primary)" }} />
              ) : statusSuccess ? (
                <CheckCircle2
                  size={16}
                  style={{
                    color: "var(--primary, #00ffaa)",
                    animation: "fadeOutStatus 3s forwards"
                  }}
                />
              ) : null}
              <style>{`
                @keyframes fadeOutStatus {
                  0% { opacity: 1; }
                  70% { opacity: 1; }
                  100% { opacity: 0; }
                }
              `}</style>
            </div>

            <ProjectForm onUploaded={handleUploaded} />

            <div className="projects-section">
              <div className="projects-section-header">
                <h2>
                  <Film size={20} />
                  All Projects ({projects.length})
                </h2>
                <div className="projects-search">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Search projects..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="dash-loading">
                  <Loader2 size={24} className="spin" />
                  Loading projects…
                </div>
              ) : projects.length === 0 ? (
                <div className="dash-empty">
                  <AlertCircle size={24} />
                  <p>No projects yet. Upload your first video above.</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="dash-empty">
                  <AlertCircle size={24} />
                  <p>No projects found matching "{searchQuery}".</p>
                </div>
              ) : (
                <div className="projects-list">
                  {filteredProjects.map((p) => (
                    <div key={p.id} className="project-row">
                      <div className="project-thumb-mini">
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt={p.title} />
                        ) : (
                          <div className="project-thumb-placeholder">
                            <Film size={16} />
                          </div>
                        )}
                      </div>
                      <div className="project-info">
                        <h3>{p.title}</h3>
                        <p>{p.client} · {p.cat} · {p.year} · {p.dur}</p>
                      </div>
                      <div className="project-actions">
                        {p.playback_id && (
                          <span className="project-badge project-badge-video">Video</span>
                        )}
                        {!p.playback_id && (
                          <span className="project-badge project-badge-meta">Metadata only</span>
                        )}
                        <button
                          className="project-delete"
                          onClick={() => setProjectToDelete(p)}
                          disabled={deleting === p.id}
                          title="Delete project"
                        >
                          {deleting === p.id ? (
                            <Loader2 size={16} className="spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : activeTab === "messages" ? (
          <MessagesView onMessageRead={() => setUnreadCount(Math.max(0, unreadCount - 1))} />
        ) : activeTab === "feedback" ? (
          <FeedbackView onFeedbackRead={() => setUnreadFeedbackCount(Math.max(0, unreadFeedbackCount - 1))} />
        ) : activeTab === "bin" ? (
          <BinView />
        ) : null}
      </main>
      
      <ActivitySidebar isOpen={showActivity} onClose={() => setShowActivity(false)} />
    </div>
  );
}
