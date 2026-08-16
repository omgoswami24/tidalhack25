import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';

// Plays a live HLS traffic-camera stream (state DOTs publish these publicly).
// Overlays the camera-local clock like a CCTV timestamp.
const TZ_LABELS = {
  'America/Los_Angeles': 'PT',
  'America/Denver': 'MT',
  'America/Chicago': 'CT',
  'America/New_York': 'ET',
};

// A live stream that drops out usually recovers; give up only after repeated
// fatal errors so a momentary blip does not blank a working camera.
const MAX_RECOVERY_ATTEMPTS = 3;

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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    setFailed(false);
    const startPlayback = () => video.play().catch(() => {});

    // hls.js is tried FIRST, and native HLS only as the fallback. Chrome answers
    // canPlayType('application/vnd.apple.mpegurl') with "maybe" but cannot
    // actually decode HLS, so checking native first handed it the .m3u8
    // directly and every live feed rendered as a black rectangle.
    if (Hls.isSupported()) {
      const hls = new Hls({ liveDurationInfinity: true, enableWorker: true });
      let recoveries = 0;

      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        if (recoveries >= MAX_RECOVERY_ATTEMPTS) {
          setFailed(true);
          hls.destroy();
          return;
        }
        recoveries += 1;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        else {
          setFailed(true);
          hls.destroy();
        }
      });

      return () => hls.destroy();
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', startPlayback);
      video.addEventListener('error', () => setFailed(true));
      return () => {
        video.removeEventListener('loadedmetadata', startPlayback);
      };
    }

    setFailed(true);
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

      {/* A camera that cannot be played says so, rather than sitting black and
          looking identical to a feed that simply has not loaded yet. */}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/80">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-red-300">
            No Signal
          </span>
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500">
            Camera unavailable
          </span>
        </div>
      )}

      {showClock && !failed && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-[11px] font-mono pointer-events-none">
          {clock} {TZ_LABELS[tz] || ''}
        </div>
      )}
    </div>
  );
};

export default LiveStreamPlayer;
