import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Scissors, Film, Volume2, Palette, Layers, Clapperboard,
  Send, ArrowUpRight, Menu, X, Circle, Aperture, Waves, Clock,
  CheckCircle2, ChevronRight, Instagram, Twitter, Youtube, Mail,
} from "lucide-react";

/* tracked at module scope so any Reveal instance can read the current
   scroll direction without prop-drilling or context re-renders */
let __scrollDir = "down";
let __lastY = 0;

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const NAV = [
  { id: "home", code: "00:00", label: "Intro" },
  { id: "work", code: "01:00", label: "Work" },
  { id: "about", code: "02:00", label: "About" },
  { id: "services", code: "03:00", label: "Services" },
  { id: "contact", code: "04:00", label: "Contact" },
];

const PROJECTS = [
  { id: 1, title: "Static & Signal", client: "Halcyon Records", cat: "Music Video", role: "Edit, Color, VFX comp", tools: "Premiere · Resolve · AE", dur: "3:24", year: "2026", blurb: "Performance footage from four shoot days cut against a single continuous lighting rig malfunction as the narrative spine — the flicker sets the cut rate." },
  { id: 2, title: "Ninth Floor", client: "Meridian Studios", cat: "Documentary", role: "Assembly, Fine Cut, Sound", tools: "Avid · Pro Tools", dur: "18:40", year: "2025", blurb: "47 hours of verité footage from a shuttering garment factory, cut down to eighteen minutes without narration — the ambient sound carries the argument." },
  { id: 3, title: "Field Notes Vol. 2", client: "Departure Co.", cat: "Commercial", role: "Edit, Grade, Delivery", tools: "Resolve · After Effects", dur: "0:45", year: "2026", blurb: "A 45-second spot built entirely from a single handheld oner, re-timed and split into five apparent cuts using speed ramps and whip pans." },
  { id: 4, title: "Low Tide", client: "Self-initiated", cat: "Short Film", role: "Full post-production", dur: "9:12", year: "2025", tools: "Premiere · DaVinci · Fairlight", blurb: "A dialogue-free short cut on the tide tables of a single beach over one calendar year, structured around six real high-tide timestamps." },
  { id: 5, title: "Counter Service", client: "Bloom & Ash", cat: "Social Cuts", role: "Edit, Motion Graphics", dur: "0:28", year: "2026", tools: "Premiere · AE", blurb: "A batch of eleven vertical cutdowns from one café shoot, each built around a different customer sound-bite as the cold open." },
  { id: 6, title: "Signal Loss", client: "Rearview Films", cat: "Music Video", role: "Edit, Color", dur: "4:02", year: "2025", tools: "Resolve · AE", blurb: "Analog camcorder inserts intercut with 8K masters, graded to match a single degraded VHS reference tape shot in 1997." },
];

const FILTERS = ["All", "Music Video", "Documentary", "Commercial", "Short Film", "Social Cuts"];

const TOOLS = ["Premiere Pro", "DaVinci Resolve", "After Effects", "Avid Media Composer", "Pro Tools", "Fairlight"];

const TIMELINE = [
  { yr: "2019", t: "Started as an assistant editor, sports broadcast desk", d: "Logged footage, pulled highlight packages on same-day turnaround." },
  { yr: "2021", t: "First feature-length documentary credit", d: "Co-edited a 90-minute doc that played three regional festivals." },
  { yr: "2023", t: "Went independent", d: "Began taking commercial and music-video work directly from small studios." },
  { yr: "2025", t: "Studio partnership with Rearview Films", d: "Now handling color for their whole release slate, six to eight cuts a year." },
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

  return (
    <Reveal className={`fade-delay-${delay % 3}`}>
      <button className="proj-card" onClick={onClick} data-cursor="view">
        <div
          ref={thumbRef}
          className={`proj-thumb ${hovering ? "proj-thumb-scrub" : ""}`}
          data-cat={p.cat}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => { setHovering(false); setScrub(0); }}
          onMouseMove={onMove}
          style={{ backgroundPosition: `${scrub * 100}% 50%` }}
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
  const mag1 = useMagnetic(12);
  const mag2 = useMagnetic(10);
  return (
    <>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Editor &amp; Colorist — based remote, working worldwide</p>
            <h1 className="h1">
              Cuts that hold<br />the attention<br /><span className="h1-accent">you fought for.</span>
            </h1>
            <p className="hero-sub">
              I'm Nova Reyes. I edit and grade documentary, commercial, and music-video work for
              studios who need the footage to earn every second of runtime — nothing pads a timeline
              on my watch.
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

      <section className="section">
        <Reveal>
          <SectionLabel n="01">Selected work</SectionLabel>
        </Reveal>
        <div className="feature-grid">
          {PROJECTS.slice(0, 3).map((p, i) => (
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
    </>
  );
}

function Work({ go }) {
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(null);
  const list = filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.cat === filter);

  return (
    <section className="section page-top">
      <div className="page-header">
        <DepthMonitor size="small" />
        <div>
          <p className="eyebrow">01:00 — Work</p>
          <h1 className="h2">The archive</h1>
          <p className="page-sub">Six cuts, four categories. Filter by the kind of problem the edit had to solve.</p>
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
            <div className="proj-thumb modal-thumb" data-cat={active.cat}>
              <Play size={28} />
              <span className="proj-dur">{active.dur}</span>
            </div>
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
  );
}

function About() {
  return (
    <section className="section page-top">
      <div className="page-header">
        <DepthMonitor size="small" />
        <div>
          <p className="eyebrow">02:00 — About</p>
          <h1 className="h2">Seven years in the timeline</h1>
          <p className="page-sub">I trained as an assistant editor on a broadcast desk, which means I still can't
            watch anything without noticing the cut points.</p>
        </div>
      </div>

      <Reveal>
        <p className="about-bio">
          Most of what I do is triage: forty hours of footage, a delivery date, and a client who's too
          close to the material to see what the audience actually needs. My job is the outside eye —
          finding the three minutes that were always the film, and cutting away everything else without
          apologizing for it. I split time between narrative editing and color, which means the grade
          is never an afterthought bolted onto someone else's cut.
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
  );
}

function Services({ go }) {
  const mag = useMagnetic(12);
  return (
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
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", type: "Commercial", message: "" });

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
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
          {sent ? (
            <div className="sent-panel">
              <CheckCircle2 size={28} />
              <h3>Export queued.</h3>
              <p>That's everything I need for now — I'll follow up by email shortly.</p>
            </div>
          ) : (
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
                  {FILTERS.filter((f) => f !== "All").map((f) => <option key={f}>{f}</option>)}
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
          )}
        </Reveal>

        <Reveal>
          <div className="contact-side">
            <div className="contact-block">
              <span className="contact-label">Direct</span>
              <a href="mailto:hello@novareyes.cut" className="contact-line"><Mail size={15} /> hello@novareyes.cut</a>
            </div>
            <div className="contact-block">
              <span className="contact-label">Elsewhere</span>
              <a href="#" className="contact-line"><Instagram size={15} /> @novareyes.cut</a>
              <a href="#" className="contact-line"><Youtube size={15} /> Nova Reyes — Reel</a>
              <a href="#" className="contact-line"><Twitter size={15} /> @novacuts</a>
            </div>
            <div className="contact-block">
              <span className="contact-label">Status</span>
              <p className="status-line"><span className="status-dot" /> Booking Q4 2026</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
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
      <style>{CSS}</style>

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
        <span className="boot-label">N. REYES — REEL</span>
      </div>

      <div className={`cut-overlay ${cutting ? "cut-overlay-active" : ""}`} />

      <div className="scrub-bar"><div className="scrub-fill" style={{ width: `${progress * 100}%` }} /></div>

      <header className="nav">
        <button className="logo" onClick={() => go("home")}>
          <span className="logo-dot" /> N. REYES
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
          <span>© {new Date().getFullYear()} Nova Reyes</span>
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

/* ------------------------------------------------------------------ */
/*  STYLES                                                             */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root{
  --void:#0B0C0E;
  --panel:#141519;
  --panel2:#1B1D22;
  --line:#2A2C31;
  --ink:#ECE7DE;
  --ink-dim:#9C9A93;
  --flame:#FF5B2E;
  --cyan:#48D8CC;
}

*{box-sizing:border-box;}
.app{
  background:var(--void);
  color:var(--ink);
  font-family:'Inter',sans-serif;
  min-height:100vh;
  position:relative;
  overflow-x:hidden;
}
h1,h2,h3{font-family:'Space Grotesk',sans-serif; margin:0; letter-spacing:-0.01em;}
p{margin:0;}
button{font-family:inherit; cursor:pointer;}
a{text-decoration:none; color:inherit;}

/* scrub bar */
.scrub-bar{position:fixed; top:0; left:0; right:0; height:2px; background:var(--line); z-index:100;}
.scrub-fill{height:100%; background:linear-gradient(90deg, var(--flame), var(--cyan)); transition:width .1s linear;}

/* nav */
.nav{
  position:sticky; top:2px; z-index:50;
  display:flex; align-items:center; justify-content:space-between;
  padding:18px 40px;
  background:rgba(18,19,23,0.5);
  backdrop-filter:blur(20px) saturate(180%);
  -webkit-backdrop-filter:blur(20px) saturate(180%);
  border-bottom:1px solid rgba(255,255,255,0.08);
  box-shadow:0 8px 32px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
}
.logo{background:none; border:none; color:var(--ink); font-family:'Space Grotesk',sans-serif; font-weight:600; letter-spacing:0.08em; font-size:14px; display:flex; align-items:center; gap:8px;}
.logo-dot{width:8px; height:8px; border-radius:50%; background:var(--flame); box-shadow:0 0 8px var(--flame);}
.nav-links{display:flex; gap:4px; position:relative;}
.nav-indicator{
  position:absolute; top:0; bottom:0; z-index:0; border-radius:100px;
  background:linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));
  backdrop-filter:blur(14px) saturate(200%);
  -webkit-backdrop-filter:blur(14px) saturate(200%);
  border:1px solid rgba(255,255,255,0.16);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.2), 0 6px 18px -6px rgba(0,0,0,0.4);
  opacity:0; transition:left .38s cubic-bezier(.22,1,.36,1), width .38s cubic-bezier(.22,1,.36,1), opacity .25s ease;
  pointer-events:none;
}
.nav-indicator-ready{opacity:1;}
.nav-link{position:relative; z-index:1; background:none; border:none; color:var(--ink-dim); font-size:13px; padding:8px 14px; border-radius:100px; display:flex; align-items:center; gap:6px; transition:color .2s;}
.nav-link:hover{color:var(--ink);}
.nav-link-active{color:var(--ink);}
.nav-code{font-family:'IBM Plex Mono',monospace; font-size:10px; opacity:0.7;}
.menu-btn{display:none; background:rgba(255,255,255,0.05); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.1); color:var(--ink); border-radius:8px; padding:8px;}
.mobile-menu{display:none;}

@media (max-width:860px){
  .nav-links{display:none;}
  .menu-btn{display:block;}
  .mobile-menu{
    display:flex; flex-direction:column; padding:10px 24px 24px; gap:2px;
    border-bottom:1px solid rgba(255,255,255,0.08);
    background:rgba(14,15,18,0.72);
    backdrop-filter:blur(22px) saturate(180%);
    -webkit-backdrop-filter:blur(22px) saturate(180%);
  }
  .mobile-link{background:none; border:none; color:var(--ink-dim); text-align:left; padding:12px 4px; display:flex; gap:10px; align-items:center; border-bottom:1px solid var(--line); font-size:15px;}
}

/* hero */
.hero{padding:70px 40px 40px; max-width:1320px; margin:0 auto;}
.hero-grid{display:grid; grid-template-columns:1.1fr 1fr; gap:60px; align-items:center;}
.eyebrow{font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--cyan); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:18px;}
.h1{font-size:clamp(38px, 5vw, 64px); line-height:1.02; font-weight:600;}
.h1-accent{color:var(--flame);}
.hero-sub{margin-top:22px; color:var(--ink-dim); font-size:16px; line-height:1.6; max-width:460px;}
.hero-actions{display:flex; gap:14px; margin-top:34px;}
.btn{display:inline-flex; align-items:center; gap:8px; font-size:14px; font-weight:500; padding:13px 22px; border-radius:100px; border:1px solid transparent; transition:transform .15s, background .2s, border-color .2s;}
.btn:hover{transform:translateY(-1px);}
.btn-primary{background:var(--ink); color:var(--void);}
.btn-primary:hover{background:var(--flame); color:var(--ink);}
.btn-ghost{border-color:var(--line); color:var(--ink); background:none;}
.btn-ghost:hover{border-color:var(--ink-dim);}
.btn-wide{width:100%; justify-content:center;}

@media (max-width:960px){
  .hero-grid{grid-template-columns:1fr; gap:40px;}
  .hero{padding:40px 22px 20px;}
}

/* depth monitor */
.dm-wrap{display:flex; flex-direction:column; align-items:center; gap:14px;}
.dm-bezel{
  position:relative; width:100%; max-width:520px; aspect-ratio:16/10;
  background:#08090a; border-radius:14px; border:1px solid var(--line);
  overflow:hidden; perspective:800px;
  box-shadow:0 30px 80px -20px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.02);
}
.dm-small .dm-bezel{max-width:150px; border-radius:10px;}
.dm-small{gap:0;}
.dm-corner{position:absolute; width:14px; height:14px; border:1.5px solid var(--flame); opacity:0.7; z-index:5;}
.dm-tl{top:8px; left:8px; border-right:none; border-bottom:none;}
.dm-tr{top:8px; right:8px; border-left:none; border-bottom:none;}
.dm-bl{bottom:8px; left:8px; border-right:none; border-top:none;}
.dm-br{bottom:8px; right:8px; border-left:none; border-top:none;}
.dm-small .dm-corner{width:8px; height:8px;}
.dm-layer{position:absolute; inset:-20px; transition:transform .15s ease-out;}
.dm-backdrop{background:
    radial-gradient(circle at 30% 20%, rgba(72,216,204,0.25), transparent 55%),
    radial-gradient(circle at 75% 80%, rgba(255,91,46,0.22), transparent 55%),
    linear-gradient(160deg, #14151a, #0a0b0d);
}
.dm-mid{transition:transform .1s ease-out;}
.dm-shape{position:absolute; border-radius:50%; filter:blur(1px);}
.dm-shape-1{width:38%; height:60%; left:14%; top:22%; background:linear-gradient(180deg, rgba(255,255,255,0.08), transparent); border-radius:40% 40% 50% 50%;}
.dm-shape-2{width:22%; height:22%; right:16%; top:14%; background:rgba(255,91,46,0.35); border-radius:50%; filter:blur(6px);}
.dm-grain{opacity:0.05; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); mix-blend-mode:overlay;}
.dm-chrome{position:absolute; inset:0; display:flex; flex-direction:column; justify-content:space-between; padding:14px; transition:transform .1s ease-out;}
.dm-small .dm-chrome{padding:8px;}
.dm-topbar{display:flex; justify-content:space-between; align-items:center; font-family:'IBM Plex Mono',monospace; font-size:10px; color:var(--ink-dim);}
.dm-rec{display:flex; align-items:center; gap:4px; color:var(--flame);}
.dm-small .dm-topbar{font-size:6px;}
.dm-crosshair-wrap{position:relative; flex:1;}
.dm-crosshair-h{position:absolute; top:50%; left:0; right:0; height:1px; background:rgba(255,255,255,0.08);}
.dm-crosshair-v{position:absolute; left:50%; top:0; bottom:0; width:1px; background:rgba(255,255,255,0.08);}
.dm-waveform{display:flex; align-items:center; gap:2px; height:34px; margin:8px 0;}
.dm-small .dm-waveform{height:14px; margin:2px 0;}
.dm-waveform span{flex:1; background:var(--cyan); opacity:0.55; border-radius:1px; min-width:1px;}
.dm-bottombar{display:flex; justify-content:space-between; align-items:center; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--ink);}
.dm-small .dm-bottombar{font-size:6px;}
.dm-tc-label{color:var(--ink-dim); font-size:9px;}
.dm-small .dm-tc-label{display:none;}
.dm-caption{font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--ink-dim); letter-spacing:0.02em;}

/* credits strip */
.credits-strip{border-top:1px solid var(--line); border-bottom:1px solid var(--line); overflow:hidden; padding:16px 0; margin-top:30px;}
.credits-track{display:flex; gap:40px; width:max-content; animation:scroll-left 26s linear infinite;}
.credits-item{display:flex; align-items:center; gap:8px; font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--ink-dim); white-space:nowrap; text-transform:uppercase; letter-spacing:0.05em;}
@keyframes scroll-left{from{transform:translateX(0);} to{transform:translateX(-50%);}}

/* sections */
.section{max-width:1320px; margin:0 auto; padding:90px 40px;}
.section-tight{padding-top:0;}
.page-top{padding-top:60px;}
@media (max-width:860px){.section{padding:60px 22px;}}

.section-label{display:flex; align-items:center; gap:14px; margin-bottom:36px; color:var(--ink-dim); font-size:13px; text-transform:uppercase; letter-spacing:0.1em;}
.section-label-code{font-family:'IBM Plex Mono',monospace; color:var(--flame);}
.section-label-line{flex:0 0 40px; height:1px; background:var(--line);}

.feature-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:22px;}
.feature-grid-wide{margin-top:30px;}
@media (max-width:900px){.feature-grid{grid-template-columns:1fr;}}

.proj-card{background:var(--panel); border:1px solid var(--line); border-radius:14px; overflow:hidden; text-align:left; padding:0; transition:transform .2s, border-color .2s;}
.proj-card:hover{transform:translateY(-4px); border-color:var(--ink-dim);}
.proj-thumb{position:relative; aspect-ratio:16/10; display:flex; align-items:center; justify-content:center; color:var(--ink); background:linear-gradient(150deg, #1c1e24, #101115);}
.proj-thumb[data-cat="Music Video"]{background:linear-gradient(150deg, #241820, #101115);}
.proj-thumb[data-cat="Documentary"]{background:linear-gradient(150deg, #16211f, #101115);}
.proj-thumb[data-cat="Commercial"]{background:linear-gradient(150deg, #1c1e24, #101115);}
.proj-thumb[data-cat="Short Film"]{background:linear-gradient(150deg, #221c14, #101115);}
.proj-thumb[data-cat="Social Cuts"]{background:linear-gradient(150deg, #141f24, #101115);}
.proj-dur{position:absolute; bottom:10px; right:12px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--ink-dim);}
.proj-meta{padding:16px 18px 20px;}
.proj-meta h3{font-size:16px; font-weight:600;}
.proj-meta p{color:var(--ink-dim); font-size:13px; margin-top:4px;}

.center-cta{display:flex; justify-content:center; margin-top:40px;}
.link-arrow{display:flex; align-items:center; gap:6px; background:none; border:none; color:var(--ink); font-size:14px; border-bottom:1px solid var(--line); padding-bottom:2px;}

.pipeline{display:flex; align-items:center; gap:14px; flex-wrap:wrap;}
.pipeline-step{display:flex; align-items:center; gap:10px; background:var(--panel); border:1px solid var(--line); padding:12px 18px; border-radius:100px; font-size:14px;}
.pipeline-num{font-family:'IBM Plex Mono',monospace; color:var(--cyan); font-size:12px;}
.pipeline-arrow{color:var(--ink-dim);}

/* page header */
.page-header{display:grid; grid-template-columns:150px 1fr; gap:30px; align-items:center; margin-bottom:56px;}
.page-sub{color:var(--ink-dim); margin-top:12px; font-size:15px; max-width:520px; line-height:1.6;}
.h2{font-size:clamp(28px,4vw,42px); font-weight:600;}
.h3{font-size:24px; font-weight:600; margin-top:6px;}
@media (max-width:640px){.page-header{grid-template-columns:1fr;} .dm-small .dm-bezel{max-width:110px;}}

/* work filters */
.filters{display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;}
.filter-pill{background:none; border:1px solid var(--line); color:var(--ink-dim); padding:8px 16px; border-radius:100px; font-size:13px; transition:all .2s;}
.filter-pill-active{background:var(--ink); color:var(--void); border-color:var(--ink);}

/* modal */
.modal-backdrop{position:fixed; inset:0; background:rgba(6,7,8,0.8); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:200; padding:24px;}
.modal{background:var(--panel2); border:1px solid var(--line); border-radius:18px; max-width:560px; width:100%; padding:28px; position:relative; max-height:88vh; overflow:auto;}
.modal-close{position:absolute; top:18px; right:18px; background:var(--panel); border:1px solid var(--line); border-radius:8px; color:var(--ink); padding:6px;}
.modal-thumb{margin-bottom:18px; border-radius:12px;}
.modal-blurb{color:var(--ink-dim); margin-top:14px; line-height:1.6; font-size:14px;}
.modal-meta{display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:22px; border-top:1px solid var(--line); padding-top:18px;}
.modal-meta span{font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--ink-dim);}
.modal-meta p{margin-top:4px; font-size:13px;}
@media (max-width:520px){.modal-meta{grid-template-columns:1fr;}}

/* about */
.about-bio{font-size:18px; line-height:1.7; color:var(--ink-dim); max-width:720px; margin-bottom:60px;}
.timeline{display:flex; flex-direction:column; margin-bottom:60px;}
.timeline-row{display:grid; grid-template-columns:90px 1fr; gap:26px; padding:22px 0; border-bottom:1px solid var(--line);}
.timeline-yr{font-family:'IBM Plex Mono',monospace; color:var(--flame); font-size:14px;}
.timeline-body h3{font-size:16px; font-weight:600;}
.timeline-body p{color:var(--ink-dim); margin-top:6px; font-size:14px; line-height:1.6;}
@media (max-width:600px){.timeline-row{grid-template-columns:1fr; gap:6px;}}

.tool-strip{display:flex; flex-wrap:wrap; gap:10px;}
.tool-chip{display:flex; align-items:center; gap:8px; background:var(--panel); border:1px solid var(--line); padding:10px 16px; border-radius:100px; font-size:13px; color:var(--ink-dim);}

/* services */
.service-list{display:flex; flex-direction:column; margin-bottom:56px;}
.service-row{display:grid; grid-template-columns:56px 1fr; gap:22px; padding:26px 0; border-bottom:1px solid var(--line);}
.service-icon{width:48px; height:48px; border-radius:12px; background:var(--panel); border:1px solid var(--line); display:flex; align-items:center; justify-content:center; color:var(--flame);}
.service-body h3{font-size:18px; font-weight:600;}
.service-body p{color:var(--ink-dim); margin-top:8px; font-size:14px; line-height:1.6; max-width:600px;}
.service-tags{display:flex; gap:18px; margin-top:14px; flex-wrap:wrap;}
.service-tags span{display:flex; align-items:center; gap:6px; font-size:12px; color:var(--cyan);}

/* contact */
.contact-grid{display:grid; grid-template-columns:1.3fr 1fr; gap:50px;}
@media (max-width:860px){.contact-grid{grid-template-columns:1fr;}}
.export-form{display:flex; flex-direction:column; gap:18px; background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:30px;}
.form-row{display:flex; flex-direction:column; gap:8px;}
.form-row label{font-size:12px; text-transform:uppercase; letter-spacing:0.06em; color:var(--ink-dim); font-family:'IBM Plex Mono',monospace;}
.form-row input, .form-row select, .form-row textarea{
  background:var(--void); border:1px solid var(--line); border-radius:8px; color:var(--ink);
  padding:11px 14px; font-size:14px; font-family:'Inter',sans-serif; resize:vertical;
}
.form-row input:focus, .form-row select:focus, .form-row textarea:focus{outline:2px solid var(--cyan); outline-offset:1px; border-color:var(--cyan);}
.sent-panel{background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:50px 30px; display:flex; flex-direction:column; align-items:center; text-align:center; gap:10px; color:var(--cyan);}
.sent-panel h3{color:var(--ink); font-size:18px;}
.sent-panel p{color:var(--ink-dim); font-size:14px;}

.contact-side{display:flex; flex-direction:column; gap:30px;}
.contact-block{display:flex; flex-direction:column; gap:10px;}
.contact-label{font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; color:var(--ink-dim); letter-spacing:0.08em;}
.contact-line{display:flex; align-items:center; gap:8px; font-size:14px; color:var(--ink); padding:4px 0;}
.contact-line:hover{color:var(--cyan);}
.status-line{display:flex; align-items:center; gap:8px; font-size:14px;}
.status-dot{width:8px; height:8px; border-radius:50%; background:var(--cyan); box-shadow:0 0 8px var(--cyan);}

/* footer */
.footer{max-width:1320px; margin:0 auto; padding:50px 40px 40px; border-top:1px solid var(--line);}
.footer-top{display:flex; align-items:center; gap:10px; color:var(--ink-dim); font-size:13px; margin-bottom:20px;}
.footer-bottom{display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; font-size:12px; color:var(--ink-dim);}
.footer-nav{display:flex; gap:16px;}
.footer-nav button{background:none; border:none; color:var(--ink-dim); font-size:12px;}
.footer-nav button:hover{color:var(--ink);}
@media (max-width:860px){.footer{padding:40px 22px 30px;}}

/* reveal on scroll — fades in on entry, fades back out on exit, in both scroll directions */
.reveal{opacity:0; transition:opacity .5s ease, transform .5s ease; will-change:opacity, transform;}
.reveal-from-down{transform:translateY(26px);}
.reveal-from-up{transform:translateY(-26px);}
.reveal-on{opacity:1; transform:translateY(0);}
.fade-delay-0{transition-delay:0s;}
.fade-delay-1{transition-delay:.08s;}
.fade-delay-2{transition-delay:.16s;}

/* custom scrollbar */
::-webkit-scrollbar{width:10px;}
::-webkit-scrollbar-track{background:var(--void);}
::-webkit-scrollbar-thumb{background:var(--panel2); border-radius:10px; border:2px solid var(--void);}
html{scrollbar-color: var(--panel2) var(--void); scrollbar-width:thin;}

/* custom cursor — camera-aperture ring, dot, and a slow pulsing echo trail */
.app-custom-cursor, .app-custom-cursor *{cursor:none !important;}

.cursor-dot{
  position:fixed; top:0; left:0; width:5px; height:5px; border-radius:50%;
  background:var(--flame); pointer-events:none; z-index:401; will-change:transform;
  transition:opacity .2s ease, transform .05s linear;
}
.cursor-hidden{opacity:0;}

.cursor-ring-wrap{position:fixed; top:0; left:0; width:0; height:0; pointer-events:none; z-index:400; will-change:transform;}
.cursor-ring{
  position:absolute; top:-18px; left:-18px; width:36px; height:36px; border-radius:50%;
  border:1.5px dashed rgba(72,216,204,0.75);
  animation:cursor-spin 7s linear infinite;
  transition:width .32s cubic-bezier(.16,1,.3,1), height .32s cubic-bezier(.16,1,.3,1),
             top .32s cubic-bezier(.16,1,.3,1), left .32s cubic-bezier(.16,1,.3,1),
             border-color .25s ease, border-style .25s ease, background .25s ease;
}
.cursor-ring-hover{
  width:54px; height:54px; top:-27px; left:-27px;
  border-color:var(--flame); border-style:solid;
  background:rgba(255,91,46,0.1);
  animation-duration:2.2s;
}
.cursor-ring-hover::after{
  content:""; position:absolute; top:50%; left:50%; width:0; height:0;
  border-style:solid; border-width:6px 0 6px 10px; border-color:transparent transparent transparent var(--flame);
  transform:translate(-32%,-50%); opacity:0.95;
}
@keyframes cursor-spin{ from{transform:rotate(0deg);} to{transform:rotate(360deg);} }

.cursor-echo-wrap{position:fixed; top:0; left:0; width:0; height:0; pointer-events:none; z-index:398; will-change:transform;}
.cursor-echo{
  position:absolute; top:-30px; left:-30px; width:60px; height:60px; border-radius:50%;
  border:1px solid rgba(72,216,204,0.3);
  animation:cursor-pulse 2.6s ease-in-out infinite;
  transition:opacity .2s ease;
}
@keyframes cursor-pulse{
  0%,100%{transform:scale(1); opacity:0.4;}
  50%{transform:scale(1.18); opacity:0.12;}
}

/* page-cut transition */
.cut-overlay{position:fixed; inset:0; background:#000; z-index:300; opacity:0; pointer-events:none; transition:opacity .24s ease;}
.cut-overlay-active{opacity:1;}
.cut-overlay-active::after{content:""; position:absolute; top:50%; left:0; right:0; height:1px; background:var(--flame); box-shadow:0 0 12px var(--flame); transform:translateY(-50%);}

/* boot sequence */
.boot-overlay{
  position:fixed; inset:0; z-index:500; background:var(--void);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px;
  transition:opacity .5s ease, visibility .5s;
}
.boot-overlay-done{opacity:0; visibility:hidden; pointer-events:none;}
.boot-rec{display:flex; align-items:center; gap:6px; color:var(--flame); font-family:'IBM Plex Mono',monospace; font-size:13px; letter-spacing:0.1em; animation:boot-pulse 0.9s ease-in-out infinite;}
.boot-label{font-family:'Space Grotesk',sans-serif; font-size:12px; color:var(--ink-dim); letter-spacing:0.2em; text-transform:uppercase;}
@keyframes boot-pulse{0%,100%{opacity:1;} 50%{opacity:0.35;}}

/* hover-scrub project thumbnails */
.proj-thumb{background-size:220% 220%; transition:background-position .05s linear;}
.proj-thumb-scrub{cursor:none;}
.scrub-track{position:absolute; left:10px; right:10px; bottom:10px; height:2px; background:rgba(255,255,255,0.15); border-radius:2px;}
.scrub-head{position:absolute; top:50%; width:8px; height:8px; border-radius:50%; background:var(--flame); transform:translate(-50%,-50%); box-shadow:0 0 8px var(--flame);}

/* headline glitch on hover — subject-appropriate, hover-gated so it never runs idle */
.h1-accent{display:inline-block; transition:text-shadow .15s;}
.h1-accent:hover{animation:headline-glitch .35s steps(2) 1;}
@keyframes headline-glitch{
  0%{text-shadow:none;}
  30%{text-shadow:-2px 0 var(--cyan), 2px 0 var(--flame);}
  60%{text-shadow:2px 0 var(--cyan), -2px 0 var(--flame);}
  100%{text-shadow:none;}
}

@media (prefers-reduced-motion: reduce){
  .reveal{opacity:1; transform:none; transition:none;}
  .credits-track{animation:none;}
  .dm-layer, .dm-chrome{transition:none;}
  .boot-overlay{display:none;}
  .cut-overlay{display:none;}
  .h1-accent:hover{animation:none;}
  .boot-rec{animation:none;}
  .cursor-ring, .cursor-echo{animation:none;}
}
@media (pointer:coarse){
  .cursor-dot, .cursor-ring-wrap, .cursor-echo-wrap{display:none;}
}
`;
