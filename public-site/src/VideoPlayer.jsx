import React, { useState } from "react";
import { Play } from "lucide-react";

/**
 * VideoPlayer — poster + click-to-play using Mux Player.
 *
 * When a project has a `playback_id`, this component renders:
 *   - A poster thumbnail (from Mux image service) with a Play button overlay
 *   - On click, swaps to a <mux-player> element for HLS playback
 *
 * When there's no `playback_id`, it renders the original gradient placeholder
 * with a Play icon, exactly matching the existing design.
 */
export default function VideoPlayer({ playbackId, poster, aspectRatio = "16:9", className = "" }) {
  const [playing, setPlaying] = useState(false);

  // No Mux video — render original placeholder
  if (!playbackId) {
    return null;
  }

  const posterUrl =
    poster ||
    `https://image.mux.com/${playbackId}/thumbnail.png?width=640&height=360&fit_mode=smartcrop`;

  const [w, h] = aspectRatio.split(":").map(Number);
  const ratioFloat = (w && h) ? (w / h) : (16 / 9);
  
  const wrapperStyle = { 
    aspectRatio: aspectRatio.replace(":", "/"),
    maxWidth: `calc(55vh * ${ratioFloat})`,
    margin: "0 auto"
  };

  if (playing) {
    return (
      <div className={`video-player-wrap ${className}`} style={wrapperStyle}>
        <mux-player
          stream-type="on-demand"
          playback-id={playbackId}
          autoplay
          style={{ width: "100%", height: "100%", "--media-object-fit": "cover" }}
        />
      </div>
    );
  }

  return (
    <div className={`video-player-wrap ${className}`} style={wrapperStyle}>
      <div className="video-poster-wrap" onClick={() => setPlaying(true)}>
        <img src={posterUrl} alt="Video thumbnail" loading="lazy" />
        <div className="video-play-btn">
          <Play size={32} fill="white" color="white" />
        </div>
      </div>
    </div>
  );
}
