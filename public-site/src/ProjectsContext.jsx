import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

/* ── Fallback data (original hardcoded projects) ──────────────────── */
const MOCK_PROJECTS = [
  { id: 1, title: "Static & Signal", client: "Halcyon Records", cat: "Music Video", role: "Edit, Color, VFX comp", tools: "Premiere · Resolve · AE", dur: "3:24", year: "2026", blurb: "Performance footage from four shoot days cut against a single continuous lighting rig malfunction as the narrative spine — the flicker sets the cut rate." },
  { id: 2, title: "Ninth Floor", client: "Meridian Studios", cat: "Documentary", role: "Assembly, Fine Cut, Sound", tools: "Avid · Pro Tools", dur: "18:40", year: "2025", blurb: "47 hours of verité footage from a shuttering garment factory, cut down to eighteen minutes without narration — the ambient sound carries the argument." },
  { id: 3, title: "Field Notes Vol. 2", client: "Departure Co.", cat: "Commercial", role: "Edit, Grade, Delivery", tools: "Resolve · After Effects", dur: "0:45", year: "2026", blurb: "A 45-second spot built entirely from a single handheld oner, re-timed and split into five apparent cuts using speed ramps and whip pans." },
  { id: 4, title: "Low Tide", client: "Self-initiated", cat: "Short Film", role: "Full post-production", dur: "9:12", year: "2025", tools: "Premiere · DaVinci · Fairlight", blurb: "A dialogue-free short cut on the tide tables of a single beach over one calendar year, structured around six real high-tide timestamps." },
  { id: 5, title: "Counter Service", client: "Bloom & Ash", cat: "Social Cuts", role: "Edit, Motion Graphics", dur: "0:28", year: "2026", tools: "Premiere · AE", blurb: "A batch of eleven vertical cutdowns from one café shoot, each built around a different customer sound-bite as the cold open." },
  { id: 6, title: "Signal Loss", client: "Rearview Films", cat: "Music Video", role: "Edit, Color", dur: "4:02", year: "2025", tools: "Resolve · AE", blurb: "Analog camcorder inserts intercut with 8K masters, graded to match a single degraded VHS reference tape shot in 1997." },
];

const ProjectsContext = createContext({ projects: [], loading: true });

export function useProjects() {
  return useContext(ProjectsContext);
}

export function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── No Supabase configured → use mock data ────────────────
    if (!supabase) {
      setProjects(MOCK_PROJECTS);
      setLoading(false);
      return;
    }

    // ── Initial fetch ─────────────────────────────────────────
    async function fetchProjects() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    }

    fetchProjects();

    // ── Realtime subscription ─────────────────────────────────
    const channel = supabase
      .channel("projects-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "projects" },
        (payload) => {
          setProjects((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "projects" },
        (payload) => {
          setProjects((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projects" },
        (payload) => {
          setProjects((prev) =>
            prev.map((p) => (p.id === payload.new.id ? payload.new : p))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ProjectsContext.Provider value={{ projects, loading }}>
      {children}
    </ProjectsContext.Provider>
  );
}
