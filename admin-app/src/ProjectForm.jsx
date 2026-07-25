import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { logActivity } from "./activityLogger";
import { Upload, Loader2 } from "lucide-react";

const CATEGORIES = ["Music Video", "Documentary", "Commercial", "Short Film", "Social Cuts", "Reels", "YouTube Video", "Wedding", "Corporate"];
const TOOLS_OPTIONS = ["Premiere Pro", "DaVinci Resolve", "After Effects", "CapCut", "Avid Media Composer", "Pro Tools", "Fairlight", "Premiere · Resolve · AE", "Premiere · AE"];
const ROLE_OPTIONS = ["Edit", "Color", "VFX", "Edit, Color", "Edit, Color, VFX", "Motion Graphics", "Assembly, Fine Cut, Sound", "Full post-production"];
const ASPECT_RATIOS = ["16:9", "9:16", "4:3", "1:1", "2.35:1"];

export default function ProjectForm({ onUploaded }) {
  const [form, setForm] = useState({
    title: "",
    client: "",
    cat: CATEGORIES[0],
    role: ROLE_OPTIONS[0],
    tools: TOOLS_OPTIONS[0],
    dur: "",
    year: new Date().getFullYear().toString(),
    blurb: "",
    aspect_ratio: "16:9",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError("Please select a video file.");
      return;
    }
    if (!supabase) {
      setError("Supabase not configured.");
      return;
    }

    setUploading(true);
    setError("");
    setProgress("Preparing upload…");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Not authenticated. Please log in again.");
        setUploading(false);
        return;
      }

      setProgress("Getting secure upload URL…");
      setUploadPercentage(0);

      // 1. Get Direct Upload URL from Edge Function
      const urlRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-video`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "get_url" })
      });
      
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error || "Failed to get upload URL");
      
      const { uploadUrl, uploadId } = urlData;

      setProgress("Uploading video directly to Mux…");

      // 2. Upload video file directly to Mux
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", videoFile.type || "video/mp4");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadPercentage(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Direct upload failed with status " + xhr.status));
          }
        };

        xhr.onerror = () => reject(new Error("Network error occurred during direct upload."));
        xhr.send(videoFile);
      });

      setProgress("Processing video & saving project… (this may take a minute)");
      setUploadPercentage(100);

      // 3. Finalize upload and insert project
      const finalizeRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-video`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          action: "finalize", 
          uploadId, 
          ...form 
        })
      });

      const finalizeData = await finalizeRes.json();
      if (!finalizeRes.ok) throw new Error(finalizeData.error || "Failed to finalize project");

      const result = finalizeData;
      logActivity("Upload", `Uploaded new project "${form.title}"`);

      // Play Apple notification sound
      const audio = new Audio("https://www.myinstants.com/media/sounds/iphone-notification.mp3");
      audio.play().catch(console.error);

      setProgress("Done!");
      setForm({
        title: "",
        client: "",
        cat: CATEGORIES[0],
        role: ROLE_OPTIONS[0],
        tools: TOOLS_OPTIONS[0],
        dur: "",
        year: new Date().getFullYear().toString(),
        blurb: "",
      });
      setVideoFile(null);
      onUploaded?.(result.project);

      // Reset file input
      const fileInput = document.getElementById("video-file-input");
      if (fileInput) fileInput.value = "";

      setTimeout(() => {
        setProgress("");
        setUploadPercentage(0);
      }, 2000);
    } catch (err) {
      setError(err.message);
      setUploadPercentage(0);
    } finally {
      setUploading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.onloadedmetadata = () => {
        const totalSeconds = Math.round(video.duration);
        const mm = Math.floor(totalSeconds / 60);
        const ss = String(totalSeconds % 60).padStart(2, "0");
        
        const w = video.videoWidth;
        const h = video.videoHeight;
        let detectedRatio = "16:9";
        if (w && h) {
          const ratio = w / h;
          if (ratio < 0.8) detectedRatio = "9:16";
          else if (ratio < 1.2) detectedRatio = "1:1";
          else if (ratio < 1.5) detectedRatio = "4:3";
          else if (ratio > 2.2) detectedRatio = "2.35:1";
          else detectedRatio = "16:9";
        }

        setForm((prev) => ({ ...prev, dur: `${mm}:${ss}`, aspect_ratio: detectedRatio }));
        URL.revokeObjectURL(url);
      };
    }
  };

  return (
    <div className="upload-section">
      <h2>
        <Upload size={20} />
        Add New Project
      </h2>

      {error && <div className="upload-error">{error}</div>}
      {progress && <div className="upload-progress">{progress}</div>}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="upload-grid">
          <div className="upload-field">
            <label>Title *</label>
            <input required value={form.title} onChange={set("title")} placeholder="Project title" />
          </div>

          <div className="upload-field">
            <label>Client *</label>
            <input required value={form.client} onChange={set("client")} placeholder="Client name" />
          </div>

          <div className="upload-field">
            <label>Category *</label>
            <select value={form.cat} onChange={set("cat")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{background: '#000'}}>{c}</option>
              ))}
            </select>
          </div>

          <div className="upload-field">
            <label>Role *</label>
            <select value={form.role} onChange={set("role")}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r} style={{background: '#000'}}>{r}</option>
              ))}
            </select>
          </div>

          <div className="upload-field">
            <label>Tools *</label>
            <select value={form.tools} onChange={set("tools")}>
              {TOOLS_OPTIONS.map((t) => (
                <option key={t} value={t} style={{background: '#000'}}>{t}</option>
              ))}
            </select>
          </div>

          <div className="upload-field upload-field-half">
            <label>Duration *</label>
            <input required value={form.dur} onChange={set("dur")} placeholder="3:24" />
          </div>

          <div className="upload-field upload-field-half">
            <label>Year *</label>
            <input required value={form.year} onChange={set("year")} placeholder="2026" />
          </div>

          <div className="upload-field upload-field-half">
            <label>Aspect Ratio *</label>
            <select value={form.aspect_ratio} onChange={set("aspect_ratio")}>
              {ASPECT_RATIOS.map((r) => (
                <option key={r} value={r} style={{background: '#000'}}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="upload-field">
          <label>Blurb *</label>
          <textarea
            required
            rows={3}
            value={form.blurb}
            onChange={set("blurb")}
            placeholder="One or two sentences about the edit approach."
          />
        </div>

        <div className="upload-field">
          <label>Video File *</label>
          <input
            id="video-file-input"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            required
          />
          {videoFile && (
            <span className="upload-file-info">
              {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          )}
        </div>

        <button type="submit" className="upload-submit" disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 size={16} className="spin" />
              Uploading… {uploadPercentage}%
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload Project
            </>
          )}
        </button>

        {uploading && (
          <div style={{ marginTop: "16px", background: "var(--line)", borderRadius: "8px", overflow: "hidden", height: "8px", width: "100%" }}>
            <div style={{ background: "var(--primary, #00ffaa)", height: "100%", width: `${uploadPercentage}%`, transition: "width 0.2s ease-out" }} />
          </div>
        )}
      </form>
    </div>
  );
}
