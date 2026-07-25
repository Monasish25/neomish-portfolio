import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { X, Clock, Mail } from "lucide-react";

export default function ActivitySidebar({ isOpen, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !supabase) return;

    let isMounted = true;
    async function fetchActivity() {
      setLoading(true);
      const [activityRes, messagesRes] = await Promise.all([
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(50)
      ]);
      
      if (isMounted) {
        const combined = [];
        if (activityRes.data) {
          combined.push(...activityRes.data.map(item => ({ ...item, type: 'activity' })));
        }
        if (messagesRes.data) {
          combined.push(...messagesRes.data.map(item => ({
            id: 'msg-' + item.id,
            action: 'New Message',
            details: `From ${item.name} (${item.project_type})`,
            created_at: item.created_at,
            type: 'message'
          })));
        }
        combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setActivities(combined.slice(0, 50));
      }
      if (isMounted) setLoading(false);
    }

    fetchActivity();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("activity-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log" },
        (payload) => {
          if (isMounted) {
            setActivities((prev) => [{ ...payload.new, type: 'activity' }, ...prev]);
          }
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (isMounted) {
            const newMsg = {
              id: 'msg-' + payload.new.id,
              action: 'New Message',
              details: `From ${payload.new.name} (${payload.new.project_type})`,
              created_at: payload.new.created_at,
              type: 'message'
            };
            setActivities((prev) => [newMsg, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(messagesChannel);
    };
  }, [isOpen]);

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const isToday = new Date().toDateString() === d.toDateString();
    
    if (isToday) {
      return `Today at ${time}, ${d.getFullYear()}`;
    }
    
    const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${date} at ${time}, ${d.getFullYear()}`;
  };

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'sidebar-open' : ''}`} onClick={onClose} />
      <div className={`activity-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h3>Activity Log</h3>
          <button onClick={onClose} className="sidebar-close" title="Close sidebar">
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-content">
          {loading ? (
            <p className="sidebar-empty">Loading...</p>
          ) : activities.length === 0 ? (
            <p className="sidebar-empty">No recent activity found.</p>
          ) : (
            <div className="activity-list">
              {activities.map((item) => (
                <div key={item.id} className={`activity-item ${item.type === 'message' ? 'activity-item-message' : ''}`}>
                  <div className="activity-icon">
                    {item.type === 'message' ? <Mail size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="activity-details">
                    <span className="activity-action">{item.action}</span>
                    <p className="activity-desc">{item.details}</p>
                    <span className="activity-time">{formatDate(item.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
