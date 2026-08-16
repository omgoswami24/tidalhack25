import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';

// Plays a live HLS traffic-camera stream (state DOTs publish these publicly).
// Overlays a CCTV-style timestamp.
//
// Every camera is stamped in one timezone rather than its own local time. The
// network spans four states, and an operator comparing tiles should not have to
// convert between them to work out which event happened first.
const DISPLAY_TZ = 'America/Chicago';
const DISPLAY_TZ_LABEL = 'CT';

// A live stream that drops out usually recovers; give up only after repeated
// fatal errors so a momentary blip does not blank a working camera.
const MAX_RECOVERY_ATTEMPTS = 3;

// If no frame has rendered by now, treat the camera as unavailable. Without
// this a host that accepts the TCP connection but never answers leaves hls.js
// waiting indefinitely and the tile simply stays black - indistinguishable
// from a feed that is still loading.
const STARTUP_TIMEOUT_MS = 15000;

const formatCameraTime = () =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: DISPLAY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date());

const LiveStreamPlayer = ({ src, className = '', showClock = true }) => {
  const videoRef = useRef(null);
  const [clock, setClock] = useState(formatCameraTime());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    setFailed(false);
    const startPlayback = () => video.play().catch(() => {});

    // Cleared by the first 'playing' event, so only a feed that never renders
    // anything trips it.
    const watchdog = setTimeout(() => setFailed(true), STARTUP_TIMEOUT_MS);
    const cancelWatchdog = () => clearTimeout(watchdog);
    video.addEventListener('playing', cancelWatchdog);

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

      return () => {
        cancelWatchdog();
        video.removeEventListener('playing', cancelWatchdog);
        hls.destroy();
      };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', startPlayback);
      video.addEventListener('error', () => setFailed(true));
      return () => {
        cancelWatchdog();
        video.removeEventListener('playing', cancelWatchdog);
        video.removeEventListener('loadedmetadata', startPlayback);
      };
    }

    cancelWatchdog();
    video.removeEventListener('playing', cancelWatchdog);
    setFailed(true);
    return undefined;
  }, [src]);

  useEffect(() => {
    if (!showClock) return undefined;
    const tick = setInterval(() => setClock(formatCameraTime()), 1000);
    return () => clearInterval(tick);
  }, [showClock]);

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
          {clock} {DISPLAY_TZ_LABEL}
        </div>
      )}
    </div>
  );
};

export default LiveStreamPlayer;
