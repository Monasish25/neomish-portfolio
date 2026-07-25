import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Scissors, Film, Volume2, Palette, Layers, Clapperboard,
  Send, ArrowUpRight, Menu, X, Circle, Aperture, Waves, Clock,
  CheckCircle2, ChevronRight, Mail, Camera, Globe, Video, MessageSquare, Star
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { useProjects } from "./ProjectsContext";
import VideoPlayer from "./VideoPlayer";

/* tracked at module scope so any Reveal instance can read the current
   scroll direction without prop-drilling or context re-renders */
let __scrollDir = "down";
let __lastY = 0;

/* ------------------------------------------------------------------ */
/*  DATA (static — not fetched)                                        */
/* ------------------------------------------------------------------ */

const NAV = [
  { id: "home", code: "00:00", label: "Intro" },
  { id: "work", code: "01:00", label: "Work" },
  { id: "about", code: "02:00", label: "About" },
  { id: "services", code: "03:00", label: "Services" },
  { id: "contact", code: "04:00", label: "Contact" },
];

// PROJECTS array removed — now served by ProjectsContext

const TOOLS = ["Premiere Pro", "DaVinci Resolve", "After Effects", "Avid Media Composer", "Pro Tools", "Fairlight", "CapCut"];

const TIMELINE = [
  { yr: "2022", t: "The Spark", d: "Realized the power of a good cut. Started learning the technical foundations of video editing and timeline management." },
  { yr: "2023", t: "Short-Form & Experimentation", d: "Began editing for social platforms, experimenting with effects, and learning what actually holds an audience's attention." },
  { yr: "2025", t: "Current Focus", d: "Dialing in color grading and taking on foundational projects to build a clean, impactful body of work." },
  { yr: "2026", t: "The Next Step", d: "Expanding into active collaborations. Ready to bring tight pacing, cinematic grades, and a dedicated focus to brands and creators looking to elevate their content." },
];

const SERVICES = [
  { icon: Scissors, name: "Narrative Editing", desc: "Assembly through picture lock — dialogue scenes, documentary structure, or branded narrative.", deliver: "Locked cut, alt versions for runtime, EDL/AAF handoff.", turnaround: "5–10 business days" },
  { icon: Palette, name: "Color Grading", desc: "Scene-to-scene grade and a consistent look built from reference stills or a prior campaign.", deliver: "Graded master, LUT export on request, stills for approval.", turnaround: "2–4 business days" },
  { icon: Layers, name: "Motion Graphics", desc: "Lower thirds, kinetic type, simple 2D comp work built to match an existing brand system.", deliver: "Rendered comps, project file, font/asset list.", turnaround: "3–6 business days" },
  { icon: Waves, name: "Sound Design & Mix", desc: "Dialogue cleanup, foley pass, and a broadcast-safe stereo mix from your production audio.", deliver: "Mixed stems, broadcast WAV, loudness report.", turnaround: "2–5 business days" },
];

const PIPELINE = ["Ingest", "Assemble", "Fine Cut", "Grade", "Deliver"];

/* ------------------------------------------------------------------ */
/*  DEPTH MONITOR — the signature parallax "4D" screen                 */
/* ------------------------------------------------------------------ */

function DepthMonitor({ size = "large" }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [tc, setTc] = useState({ h: 0, m: 12, s: 4, f: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      setTc((prev) => {
        let { h, m, s, f } = prev;
        f += 1;
        if (f >= 24) { f = 0; s += 1; }
        if (s >= 60) { s = 0; m += 1; }
        if (m >= 60) { m = 0; h += 1; }
        return { h, m, s, f };
      });
    }, 1000 / 24);
    return () => clearInterval(id);
  }, []);

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: px, y: py });
  }, []);

  const reset = () => setTilt({ x: 0, y: 0 });
  const pad = (n) => String(n).padStart(2, "0");
  const small = size === "small";

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`dm-wrap ${small ? "dm-small" : ""}`}
    >
      <div className="dm-bezel">
        <div className="dm-corner dm-tl" /><div className="dm-corner dm-tr" />
        <div className="dm-corner dm-bl" /><div className="dm-corner dm-br" />

        <div
          className="dm-layer dm-backdrop"
          style={{ transform: `translate3d(${tilt.x * 8}px, ${tilt.y * 8}px, 0) scale(1.08)` }}
        />
        <img
          src="https://dpqvnbgwjltkfwzbuoet.supabase.co/storage/v1/object/public/assets/logo.png"
          alt="My Logo"
          className="dm-layer dm-bg-logo"
          style={{ transform: `translate3d(${tilt.x * 14}px, ${tilt.y * 14}px, 0)` }}
        />
        <div
          className="dm-layer dm-mid"
          style={{ transform: `translate3d(${tilt.x * -18}px, ${tilt.y * -14}px, 0)` }}
        >
          <div className="dm-shape dm-shape-1" />
          <div className="dm-shape dm-shape-2" />
        </div>
        <div
          className="dm-layer dm-grain"
          style={{ transform: `translate3d(${tilt.x * -4}px, ${tilt.y * -4}px, 0)` }}
        />

        <div
          className="dm-chrome"
          style={{ transform: `translate3d(${tilt.x * 26}px, ${tilt.y * 20}px, 0)` }}
        >
          <div className="dm-topbar">
            <span className="dm-rec"><Circle size={8} fill="currentColor" /> REC</span>
            <span className="dm-res">3840×2160 · 23.976</span>
          </div>
          <div className="dm-crosshair-wrap">
            <div className="dm-crosshair-h" /><div className="dm-crosshair-v" />
          </div>
          <div className="dm-waveform">
            {Array.from({ length: 46 }).map((_, i) => (
              <span key={i} style={{ height: `${18 + Math.abs(Math.sin(i * 0.7 + tilt.x * 3)) * 60}%` }} />
            ))}
          </div>
          <div className="dm-bottombar">
            <span className="dm-tc">{pad(tc.h)}:{pad(tc.m)}:{pad(tc.s)}:{pad(tc.f)}</span>
            <span className="dm-tc-label">TIMELINE 01</span>
          </div>
        </div>
      </div>
      {!small && <div className="dm-caption">move your cursor — the frame has depth</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SCRAMBLE TEXT — timecode-style decode-in on hover                  */
/* ------------------------------------------------------------------ */

const SCRAMBLE_CHARS = "0123456789ABCDEF#%&";

function Scramble({ text, active }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    if (!active) { setDisplay(text); return; }
    let frame = 0;
    const totalFrames = 9;
    const id = setInterval(() => {
      frame += 1;
      const reveal = Math.floor((frame / totalFrames) * text.length);
      setDisplay(
        text
          .split("")
          .map((c, i) => (i < reveal || c === ":" ? c : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]))
          .join("")
      );
      if (frame >= totalFrames) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [active, text]);
  return <span>{display}</span>;
}

/* ------------------------------------------------------------------ */
/*  MAGNETIC — subtle cursor-pull on primary actions                   */
/* ------------------------------------------------------------------ */

function useMagnetic(strength = 14) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});
  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * strength;
    const y = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * strength;
    setStyle({ transform: `translate(${x}px, ${y}px)` });
  };
  const onMouseLeave = () => setStyle({ transform: "translate(0,0)" });
  return { ref, style, onMouseMove, onMouseLeave };
}

/* ------------------------------------------------------------------ */
/*  PROJECT CARD — hover-to-scrub thumbnail, like a real preview strip */
/* ------------------------------------------------------------------ */

function durToSeconds(dur) {
  const parts = dur.split(":").map(Number);
  return parts.reduce((acc, v) => acc * 60 + v, 0);
}

function ProjectCard({ p, onClick, delay = 0 }) {
  const thumbRef = useRef(null);
  const [scrub, setScrub] = useState(0);
  const [hovering, setHovering] = useState(false);
  const total = durToSeconds(p.dur);

  const onMove = (e) => {
    const el = thumbRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setScrub(x);
  };

  const scrubbedSeconds = Math.floor(scrub * total);
  const mm = String(Math.floor(scrubbedSeconds / 60)).padStart(2, "0");
  const ss = String(scrubbedSeconds % 60).padStart(2, "0");

  // If this project has a Mux playback_id, show the poster as background
  const hasPoster = !!p.playback_id;
  const posterUrl = p.thumbnail || (p.playback_id ? `https://image.mux.com/${p.playback_id}/thumbnail.png?width=640&height=360&fit_mode=smartcrop` : null);
  const thumbStyle = {
    aspectRatio: "16/9"
  };
  if (hasPoster && posterUrl) {
    thumbStyle.backgroundImage = `url(${posterUrl})`;
    thumbStyle.backgroundSize = "cover";
    thumbStyle.backgroundPosition = hovering ? `${scrub * 100}% 50%` : "center";
  } else {
    thumbStyle.backgroundPosition = `${scrub * 100}% 50%`;
  }

  return (
    <Reveal className={`fade-delay-${delay % 3}`}>
      <button className="proj-card" onClick={onClick} data-cursor="view">
        <div
          ref={thumbRef}
          className={`proj-thumb ${hovering ? "proj-thumb-scrub" : ""} ${hasPoster ? "proj-thumb-poster" : ""}`}
          data-cat={p.cat}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => { setHovering(false); setScrub(0); }}
          onMouseMove={onMove}
          style={thumbStyle}
        >
          {!hovering && <Play size={22} />}
          <span className="proj-dur">{hovering ? `${mm}:${ss}` : p.dur}</span>
          {hovering && (
            <div className="scrub-track">
              <div className="scrub-head" style={{ left: `${scrub * 100}%` }} />
            </div>
          )}
        </div>
        <div className="proj-meta">
          <h3>{p.title}</h3>
          <p>{p.client} · {p.cat}{p.year ? ` · ${p.year}` : ""}</p>
        </div>
      </button>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  SHARED BITS                                                        */
/* ------------------------------------------------------------------ */

function Reveal({ children, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  const [dir, setDir] = useState("down");

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDir(__scrollDir);
          setShown(true);
        } else {
          setShown(false);
        }
      },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal reveal-from-${dir} ${shown ? "reveal-on" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ n, children }) {
  return (
    <div className="section-label">
      <span className="section-label-code">{n}</span>
      <span className="section-label-line" />
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGES                                                              */
/* ------------------------------------------------------------------ */

function Home({ go }) {
  const { projects } = useProjects();
  const mag1 = useMagnetic(12);
  const mag2 = useMagnetic(10);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("project_type", "Feedback")
        .order("created_at", { ascending: false });
      if (data) {
        const parsed = data
          .map((msg) => {
            let title = "";
            let rating = 0;
            let body = msg.message;
            const titleMatch = msg.message.match(/^Title:\s*(.+)/m);
            if (titleMatch) title = titleMatch[1].trim();
            const ratingMatch = msg.message.match(/Rating:\s*(\d)\/5/);
            if (ratingMatch) rating = parseInt(ratingMatch[1]);
            const bodyMatch = msg.message.match(/Rating:\s*\d\/5\s*Stars\n\n([\s\S]*)/);
            if (bodyMatch) body = bodyMatch[1].trim();
            return { ...msg, _title: title, _rating: rating, _body: body };
          })
          .filter((t) => t._rating >= 4);
        setTestimonials(parsed);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <>
      <div className="bg-video-wrap">
        <video autoPlay loop muted playsInline className="bg-video">
          <source src="https://dpqvnbgwjltkfwzbuoet.supabase.co/storage/v1/object/public/assets/wallpaper_home.mp4" type="video/mp4" />
        </video>
        <div className="bg-video-content">
          <section className="hero">
            <div className="hero-grid">
              <div className="hero-copy">
                <p className="eyebrow">Editor &amp; Colorist — based remote, working worldwide</p>
                <h1 className="h1">
                  Cuts that hold<br />the attention<br /><span className="h1-accent">you fought for.</span>
                </h1>
                <p className="hero-sub">
                  I'm Monasish Patra. I'm an up-and-coming video editor passionate about crafting clean, engaging stories. I'm currently honing my skills in editing and color grading, with a focus on making sure every second of a project keeps the viewer's attention.
                </p>
                <div className="hero-actions">
                  <button
                    ref={mag1.ref} style={mag1.style} onMouseMove={mag1.onMouseMove} onMouseLeave={mag1.onMouseLeave}
                    className="btn btn-primary" onClick={() => go("work")}
                  >
                    View the reel <ArrowUpRight size={16} />
                  </button>
                  <button
                    ref={mag2.ref} style={mag2.style} onMouseMove={mag2.onMouseMove} onMouseLeave={mag2.onMouseLeave}
                    className="btn btn-ghost" onClick={() => go("contact")}
                  >
                    Start a project
                  </button>
                </div>
              </div>
              <div className="hero-monitor">
                <DepthMonitor />
              </div>
            </div>
          </section>

          <section className="credits-strip">
            <div className="credits-track">
              {[...TOOLS, ...TOOLS].map((t, i) => (
                <span key={i} className="credits-item"><Aperture size={13} /> {t}</span>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="section">
        <Reveal>
          <SectionLabel n="01">Selected work</SectionLabel>
        </Reveal>
        <div className="feature-grid">
          {projects.slice(0, 3).map((p, i) => (
            <ProjectCard key={p.id} p={p} delay={i} onClick={() => go("work")} />
          ))}
        </div>
        <Reveal className="center-cta">
          <button className="link-arrow" onClick={() => go("work")}>
            See the full archive <ChevronRight size={16} />
          </button>
        </Reveal>
      </section>

      <section className="section section-tight">
        <Reveal>
          <SectionLabel n="02">How a project moves</SectionLabel>
        </Reveal>
        <Reveal>
          <div className="pipeline">
            {PIPELINE.map((step, i) => (
              <React.Fragment key={step}>
                <div className="pipeline-step">
                  <span className="pipeline-num">{String(i + 1).padStart(2, "0")}</span>
                  <span>{step}</span>
                </div>
                {i < PIPELINE.length - 1 && <span className="pipeline-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
        </Reveal>
      </section>

      {testimonials.length > 0 && (
        <section className="section section-tight">
          <Reveal>
            <SectionLabel n="03">What people say</SectionLabel>
          </Reveal>
          <div className="testimonials-grid">
            {testimonials.slice(0, 6).map((t, i) => (
              <Reveal key={t.id}>
                <div className="testimonial-card">
                  <div className="testimonial-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={t._rating >= s ? "var(--cyan, #00f0ff)" : "none"}
                        color={t._rating >= s ? "var(--cyan, #00f0ff)" : "var(--text-dim, #444)"}
                      />
                    ))}
                  </div>
                  {t._title && <h4 className="testimonial-title">"{t._title}"</h4>}
                  <p className="testimonial-body">{t._body.length > 180 ? t._body.slice(0, 180) + "…" : t._body}</p>
                  <span className="testimonial-author">— {t.name}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Work({ go }) {
  const { projects } = useProjects();
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(null);

  // Derive filter categories from live data
  const FILTERS = ["All", ...new Set(projects.map((p) => p.cat))];

  const list = filter === "All" ? projects : projects.filter((p) => p.cat === filter);

  useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <div className="bg-video-wrap">
      <video autoPlay loop muted playsInline className="bg-video">
        <source src="https://dpqvnbgwjltkfwzbuoet.supabase.co/storage/v1/object/public/assets/wallpaper_archive.mp4" type="video/mp4" />
      </video>
      <div className="bg-video-content">
        <section className="section page-top">
          <div className="page-header">
            <DepthMonitor size="small" />
            <div>
              <p className="eyebrow">01:00 — Work</p>
              <h1 className="h2">The archive</h1>
              <p className="page-sub">{projects.length} cuts, {FILTERS.length - 1} categories. Filter by the kind of problem the edit had to solve.</p>
            </div>
          </div>

          <div className="filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? "filter-pill-active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="feature-grid feature-grid-wide">
            {list.map((p, i) => (
              <ProjectCard key={p.id} p={p} delay={i} onClick={() => setActive(p)} />
            ))}
          </div>

          {active && (
            <div className="modal-backdrop" onClick={() => setActive(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setActive(null)}><X size={18} /></button>
                {active.playback_id ? (
                  <VideoPlayer playbackId={active.playback_id} poster={active.thumbnail} aspectRatio={active.aspect_ratio} />
                ) : (
                  <div className="proj-thumb modal-thumb" data-cat={active.cat} style={{
                    aspectRatio: active.aspect_ratio ? active.aspect_ratio.replace(":", "/") : "16/9",
                    maxWidth: `calc(55vh * ${active.aspect_ratio ? (Number(active.aspect_ratio.split(":")[0]) / Number(active.aspect_ratio.split(":")[1])) : (16 / 9)})`,
                    margin: "0 auto"
                  }}>
                    <Play size={28} />
                    <span className="proj-dur">{active.dur}</span>
                  </div>
                )}
                <p className="eyebrow">{active.cat} · {active.year}</p>
                <h2 className="h3">{active.title}</h2>
                <p className="modal-blurb">{active.blurb}</p>
                <div className="modal-meta">
                  <div><span>Client</span><p>{active.client}</p></div>
                  <div><span>Role</span><p>{active.role}</p></div>
                  <div><span>Tools</span><p>{active.tools}</p></div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="bg-video-wrap">
      <video autoPlay loop muted playsInline className="bg-video" style={{ opacity: 0.1 }}>
        <source src="https://dpqvnbgwjltkfwzbuoet.supabase.co/storage/v1/object/public/assets/wallpaper_about.mp4" type="video/mp4" />
      </video>
      <div className="bg-video-content">
        <section className="section page-top">
          <div className="page-header">
            <DepthMonitor size="small" />
            <div>
              <p className="eyebrow">02:00 — About</p>
              <h1 className="h2">Five years in the timeline</h1>
              <p className="page-sub">I taught myself the craft from the ground up, which means I still can't watch anything without noticing the cut points.</p>
            </div>
          </div>

          <Reveal>
            <p className="about-bio">
              I am self-taught, training my eye frame by frame. Every video I watch now is a masterclass in cut points and pacing.

              Right now, my process is all about discovery and triage: taking a pile of footage and forcing myself to be ruthless with the delete key. I’m learning to find the three minutes that matter most and getting rid of the rest. By splitting my focus between the actual edit and the color grade, I'm making sure that the mood of the piece is built in from day one.
            </p>
          </Reveal>

          <Reveal>
            <SectionLabel n="—">A rough timeline</SectionLabel>
          </Reveal>
          <div className="timeline">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.yr} className={`fade-delay-${i % 3}`}>
                <div className="timeline-row">
                  <span className="timeline-yr">{t.yr}</span>
                  <div className="timeline-body">
                    <h3>{t.t}</h3>
                    <p>{t.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <SectionLabel n="—">Toolkit</SectionLabel>
          </Reveal>
          <Reveal>
            <div className="tool-strip">
              {TOOLS.map((t) => (
                <span key={t} className="tool-chip"><Clapperboard size={13} /> {t}</span>
              ))}
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}

function Services({ go }) {
  const mag = useMagnetic(12);
  return (
    <div className="bg-video-wrap">
      <video autoPlay loop muted playsInline className="bg-video" style={{ opacity: 0.1 }}>
        <source src="https://dpqvnbgwjltkfwzbuoet.supabase.co/storage/v1/object/public/assets/wallpaper_services.mp4" type="video/mp4" />
      </video>
      <div className="bg-video-content">
        <section className="section page-top">
          <div className="page-header">
            <DepthMonitor size="small" />
            <div>
              <p className="eyebrow">03:00 — Services</p>
              <h1 className="h2">What's on the render queue</h1>
              <p className="page-sub">Four things I do well, booked one project at a time — no roster of juniors, no
                handoffs mid-cut.</p>
            </div>
          </div>

          <div className="service-list">
            {SERVICES.map((s, i) => (
              <Reveal key={s.name} className={`fade-delay-${i % 3}`}>
                <div className="service-row">
                  <div className="service-icon"><s.icon size={20} /></div>
                  <div className="service-body">
                    <h3>{s.name}</h3>
                    <p>{s.desc}</p>
                    <div className="service-tags">
                      <span><CheckCircle2 size={13} /> {s.deliver}</span>
                      <span><Clock size={13} /> {s.turnaround}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <SectionLabel n="—">Pipeline, every time</SectionLabel>
          </Reveal>
          <Reveal>
            <div className="pipeline">
              {PIPELINE.map((step, i) => (
                <React.Fragment key={step}>
                  <div className="pipeline-step">
                    <span className="pipeline-num">{String(i + 1).padStart(2, "0")}</span>
                    <span>{step}</span>
                  </div>
                  {i < PIPELINE.length - 1 && <span className="pipeline-arrow">→</span>}
                </React.Fragment>
              ))}
            </div>
          </Reveal>

          <Reveal className="center-cta">
            <button
              ref={mag.ref} style={mag.style} onMouseMove={mag.onMouseMove} onMouseLeave={mag.onMouseLeave}
              className="btn btn-primary" onClick={() => go("contact")}
            >
              Book a slot <ArrowUpRight size={16} />
            </button>
          </Reveal>
        </section>
      </div>
    </div>
  );
}

function Contact() {
  const { projects } = useProjects();
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [form, setForm] = useState({ name: "", email: "", type: "Commercial", message: "" });
  const [statusText, setStatusText] = useState("Open for work");

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ name: "", email: "", title: "", message: "", rating: 0 });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackCountdown, setFeedbackCountdown] = useState(10);

  useEffect(() => {
    let timer;
    if (sent && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (sent && countdown === 0) {
      setSent(false);
    }
    return () => clearTimeout(timer);
  }, [sent, countdown]);

  useEffect(() => {
    let timer;
    if (feedbackSent && feedbackCountdown > 0) {
      timer = setTimeout(() => setFeedbackCountdown(c => c - 1), 1000);
    } else if (feedbackSent && feedbackCountdown === 0) {
      setFeedbackSent(false);
    }
    return () => clearTimeout(timer);
  }, [feedbackSent, feedbackCountdown]);

  useEffect(() => {
    async function fetchStatus() {
      const { data, error } = await supabase.from("settings").select("status_text").eq("id", 1).single();
      if (data && !error) setStatusText(data.status_text);
    }
    fetchStatus();

    const channel = supabase
      .channel("settings-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "settings" },
        (payload) => {
          console.log("Settings update received:", payload);
          if (payload.new && payload.new.status_text) {
            setStatusText(payload.new.status_text);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = () => {
    if (statusText === "Currently unavailable") return "#ff4444";
    if (statusText === "Booking Q4 2026") return "#ffcc00";
    return "var(--cyan)";
  };
  const statusColor = getStatusColor();

  // Combine base categories with any dynamic ones from projects
  const BASE_CATEGORIES = ["Commercial", "Social Cuts", "Documentary", "Music Video", "Short Film", "Reels", "YouTube Video"];
  const FILTERS = [...new Set([...BASE_CATEGORIES, ...projects.map((p) => p.cat)])];

  const submit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("messages").insert([
      {
        name: form.name,
        email: form.email,
        project_type: form.type,
        message: form.message,
      },
    ]);
    if (!error) {
      setSent(true);
      setCountdown(10);
      setForm({ name: "", email: "", type: "Commercial", message: "" });
    } else {
      console.error("Form submission error:", error);
      alert("Failed to send brief. Please email directly.");
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (feedbackForm.rating === 0) {
      alert("Please select a rating.");
      return;
    }
    const formattedMessage = `Title: ${feedbackForm.title}\nRating: ${feedbackForm.rating}/5 Stars\n\n${feedbackForm.message}`;
    const { error } = await supabase.from("messages").insert([
      {
        name: feedbackForm.name || "Anonymous",
        email: feedbackForm.email || "no-reply@portfolio.com",
        project_type: "Feedback",
        message: formattedMessage,
      },
    ]);
    if (!error) {
      setFeedbackSent(true);
      setFeedbackCountdown(10);
      setFeedbackOpen(false);
      setFeedbackForm({ name: "", email: "", title: "", message: "", rating: 0 });
    } else {
      console.error("Feedback submission error:", error);
      alert("Failed to send feedback. Please email directly.");
    }
  };

  return (
    <div className="bg-video-wrap">
      <video ref={(el) => { if (el) el.playbackRate = 0.5; }} autoPlay loop muted playsInline className="bg-video">
        <source src="https://dpqvnbgwjltkfwzbuoet.supabase.co/storage/v1/object/public/assets/wallpaper_contact.mp4" type="video/mp4" />
      </video>
      <div className="bg-video-content">
        <section className="section page-top">
          <div className="page-header">
            <DepthMonitor size="small" />
            <div>
              <p className="eyebrow">04:00 — Contact</p>
              <h1 className="h2">Set up the export</h1>
              <p className="page-sub">Currently booking projects for late Q4 2026. Tell me the basics and I'll
                reply within two business days.</p>
            </div>
          </div>

          <div className="contact-grid">
            <Reveal>
              <form className="export-form" onSubmit={submit}>
                <div className="form-row">
                  <label>Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                </div>
                <div className="form-row">
                  <label>Email</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@studio.com" />
                </div>
                <div className="form-row">
                  <label>Project type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {FILTERS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label>Brief</label>
                  <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Runtime, footage volume, delivery date — whatever you've got." />
                </div>
                <button type="submit" className="btn btn-primary btn-wide">
                  Send brief <Send size={16} />
                </button>
              </form>
            </Reveal>

            {sent && (
              <div className="contact-modal-backdrop" onClick={() => setSent(false)}>
                <div className="contact-modal" onClick={e => e.stopPropagation()}>
                  <div className="contact-modal-timer">{countdown}s</div>
                  <CheckCircle2 size={48} className="contact-modal-icon" />
                  <h3>Export queued.</h3>
                  <p>That's everything I need for now — I'll follow up by email shortly.</p>
                  <button onClick={() => setSent(false)} className="btn btn-primary contact-modal-btn">
                    OK
                  </button>
                </div>
              </div>
            )}

            {feedbackOpen && (
              <div className="modal-backdrop" onClick={() => setFeedbackOpen(false)}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', minHeight: '520px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '36px 32px 28px' }}>
                  <button className="modal-close" onClick={() => setFeedbackOpen(false)}><X size={18} /></button>
                  <h3 className="h3" style={{ textAlign: 'center', marginBottom: '24px', marginTop: '0', flexShrink: 0 }}>Send Feedback</h3>
                  <form onSubmit={submitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1, overflow: 'hidden' }}>
                    <div className="form-row" style={{ flexShrink: 0 }}>
                      <label>Title</label>
                      <input required value={feedbackForm.title} onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })} placeholder="Feedback title" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexShrink: 0 }}>
                      <div className="form-row">
                        <label>Name (Optional)</label>
                        <input value={feedbackForm.name} onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })} placeholder="Your name" />
                      </div>
                      <div className="form-row">
                        <label>Email (Optional)</label>
                        <input type="email" value={feedbackForm.email} onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })} placeholder="you@email.com" />
                      </div>
                    </div>
                    <div className="form-row" style={{ flexShrink: 0 }}>
                      <label>Rating</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={24}
                            onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                            fill={feedbackForm.rating >= star ? 'var(--cyan, #00f0ff)' : 'none'}
                            color={feedbackForm.rating >= star ? 'var(--cyan, #00f0ff)' : 'var(--text-dim, #666)'}
                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="form-row" style={{ flexGrow: 1, minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
                      <label style={{ flexShrink: 0 }}>Feedback</label>
                      <textarea required style={{ flexGrow: 1, resize: 'none', overflowY: 'auto' }} value={feedbackForm.message} onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })} placeholder="What do you think of the portfolio?" />
                    </div>
                    <button type="submit" className="btn btn-primary btn-wide" style={{ marginTop: '8px', flexShrink: 0 }}>
                      Send Feedback <Send size={16} />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {feedbackSent && (
              <div className="contact-modal-backdrop" onClick={() => setFeedbackSent(false)}>
                <div className="contact-modal" onClick={e => e.stopPropagation()}>
                  <div className="contact-modal-timer">{feedbackCountdown}s</div>
                  <CheckCircle2 size={48} className="contact-modal-icon" />
                  <h3>Feedback sent.</h3>
                  <p>Thanks for sharing your thoughts!</p>
                  <button onClick={() => setFeedbackSent(false)} className="btn btn-primary contact-modal-btn">
                    OK
                  </button>
                </div>
              </div>
            )}

            <Reveal>
              <div className="contact-side">
                <div className="contact-block">
                  <span className="contact-label">Direct</span>
                  <a href="mailto:monasish25@gmail.com" className="contact-line"><Mail size={15} /> monasish25@gmail.com</a>
                </div>
                <div className="contact-block">
                  <span className="contact-label">Elsewhere</span>
                  <a href="#" className="contact-line"><Camera size={15} /> @neomish25</a>
                  <a href="https://www.instagram.com/neomish25?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" className="contact-line"><Video size={15} /> @neomish25 — Reel</a>
                  <a href="#" className="contact-line"><Globe size={15} /> @neomish_Editz</a>
                </div>
                <div className="contact-block">
                  <span className="contact-label">Status</span>
                  <p className="status-line"><span className="status-dot" style={{ backgroundColor: statusColor, boxShadow: `0 0 12px ${statusColor}` }} /> {statusText}</p>
                </div>
                <div className="contact-block">
                  <span className="contact-label">Feedback</span>
                  <button onClick={() => setFeedbackOpen(true)} className="contact-line" style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer" }}><MessageSquare size={15} /> Send Feedback</button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP SHELL                                                          */
/* ------------------------------------------------------------------ */

export default function Portfolio() {
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [cutting, setCutting] = useState(false);
  const [booted, setBooted] = useState(false);
  const [fineCursor, setFineCursor] = useState(false);
  const [cursorHover, setCursorHover] = useState(false);

  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const echoRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const echo = useRef({ x: -100, y: -100 });

  const navLinksRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  const updateIndicator = (id) => {
    const container = navLinksRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-nav-id="${id}"]`);
    if (!el) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    setIndicator({ left: eRect.left - cRect.left, width: eRect.width, ready: true });
  };

  useEffect(() => {
    updateIndicator(page);
    const onResize = () => updateIndicator(hoveredNav || page);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const go = (id) => {
    setMenuOpen(false);
    if (id === page) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setCutting(true);
    window.setTimeout(() => {
      setPage(id);
      window.scrollTo({ top: 0 });
      window.setTimeout(() => setCutting(false), 240);
    }, 240);
  };

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(1, scrolled / max) : 0);
      if (scrolled > __lastY + 2) __scrollDir = "down";
      else if (scrolled < __lastY - 2) __scrollDir = "up";
      __lastY = scrolled;
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [page]);

  // boot sequence — brief camera power-on beat, once per load
  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setBooted(true); return; }
    const t = window.setTimeout(() => setBooted(true), 1000);
    return () => window.clearTimeout(t);
  }, []);

  // custom viewfinder cursor — desktop / fine-pointer only
  useEffect(() => {
    const fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    setFineCursor(fine);
    if (!fine) return;
    let raf;
    const loop = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.2;
      ring.current.y += (pos.current.y - ring.current.y) * 0.2;
      echo.current.x += (pos.current.x - echo.current.x) * 0.075;
      echo.current.y += (pos.current.y - echo.current.y) * 0.075;
      if (dotRef.current) dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%,-50%)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%,-50%)`;
      if (echoRef.current) echoRef.current.style.transform = `translate(${echo.current.x}px, ${echo.current.y}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      const hit = e.target.closest && e.target.closest("button, a, input, select, textarea, .proj-card");
      setCursorHover(!!hit);
    };
    window.addEventListener("mousemove", onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); };
  }, []);

  return (
    <div className={`app ${fineCursor ? "app-custom-cursor" : ""}`}>
      {fineCursor && (
        <>
          <div ref={echoRef} className={`cursor-echo-wrap ${cursorHover ? "cursor-hidden" : ""}`}>
            <div className="cursor-echo" />
          </div>
          <div ref={ringRef} className="cursor-ring-wrap">
            <div className={`cursor-ring ${cursorHover ? "cursor-ring-hover" : ""}`} />
          </div>
          <div ref={dotRef} className={`cursor-dot ${cursorHover ? "cursor-hidden" : ""}`} />
        </>
      )}

      <div className={`boot-overlay ${booted ? "boot-overlay-done" : ""}`} onClick={() => setBooted(true)}>
        <span className="boot-rec"><Circle size={9} fill="currentColor" /> REC</span>
        <span className="boot-label">Neomish — REEL</span>
      </div>

      <div className={`cut-overlay ${cutting ? "cut-overlay-active" : ""}`} />

      <div className="scrub-bar"><div className="scrub-fill" style={{ width: `${progress * 100}%` }} /></div>

      <header className="nav">
        <button className="logo" onClick={() => go("home")}>
          <span className="logo-dot" /> Neomish Editz
        </button>

        <nav className="nav-links" ref={navLinksRef}>
          <div
            className={`nav-indicator ${indicator.ready ? "nav-indicator-ready" : ""}`}
            style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
          />
          {NAV.map((n) => (
            <button
              key={n.id}
              data-nav-id={n.id}
              className={`nav-link ${page === n.id ? "nav-link-active" : ""}`}
              onClick={() => go(n.id)}
              onMouseEnter={() => { setHoveredNav(n.id); updateIndicator(n.id); }}
              onMouseLeave={() => { setHoveredNav(null); updateIndicator(page); }}
            >
              <span className="nav-code"><Scramble text={n.code} active={hoveredNav === n.id} /></span> {n.label}
            </button>
          ))}
        </nav>

        <button className="menu-btn" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {menuOpen && (
        <div className="mobile-menu">
          {NAV.map((n) => (
            <button key={n.id} className="mobile-link" onClick={() => go(n.id)}>
              <span className="nav-code">{n.code}</span> {n.label}
            </button>
          ))}
        </div>
      )}

      <main>
        {page === "home" && <Home go={go} />}
        {page === "work" && <Work go={go} />}
        {page === "about" && <About go={go} />}
        {page === "services" && <Services go={go} />}
        {page === "contact" && <Contact go={go} />}
      </main>

      <footer className="footer">
        <div className="footer-top">
          <span className="logo-dot" />
          <p>Edited &amp; graded by hand, one project at a time.</p>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Neomish_Editz</span>
          <div className="footer-nav">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => go(n.id)}>{n.label}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
