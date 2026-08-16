import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';

// Plays a live HLS traffic-camera stream (state DOTs publish these publicly).
// Safari plays HLS natively; other browsers go through hls.js.
// Overlays the camera-local clock like a CCTV timestamp.
const TZ_LABELS = {
  'America/Los_Angeles': 'PT',
  'America/Denver': 'MT',
  'America/Chicago': 'CT',
  'America/New_York': 'ET',
};

const formatCameraTime = (tz) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());

const LiveStreamPlayer = ({ src, className = '', showClock = true, tz = 'America/Los_Angeles' }) => {
  const videoRef = useRef(null);
  const [clock, setClock] = useState(formatCameraTime(tz));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return undefined;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        liveDurationInfinity: true,
        enableWorker: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        // Recover from transient network/media hiccups on live streams
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        }
      });
      return () => hls.destroy();
    }

    return undefined;
  }, [src]);

  useEffect(() => {
    if (!showClock) return undefined;
    const tick = setInterval(() => setClock(formatCameraTime(tz)), 1000);
    return () => clearInterval(tick);
  }, [showClock, tz]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      {showClock && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-[11px] font-mono pointer-events-none">
          {clock} {TZ_LABELS[tz] || ''}
        </div>
      )}
    </div>
  );
};

export default LiveStreamPlayer;
