import React, { useState, useEffect } from 'react';

// Live traffic-camera feed rendered from periodically-refreshed snapshots.
// - Preloads the next frame before swapping so there is no flicker.
// - Applies a slow pan/zoom so the monitoring tile reads as active.
// - Shows how fresh the current frame is.
const REFRESH_MS = 20000;

const LiveFeedImage = ({ url, alt, className = '', showTicker = true }) => {
  const [src, setSrc] = useState(`${url}?t=${Date.now()}`);
  const [fetchedAt, setFetchedAt] = useState(Date.now());
  const [ago, setAgo] = useState(0);

  useEffect(() => {
    setSrc(`${url}?t=${Date.now()}`);
    setFetchedAt(Date.now());
    const interval = setInterval(() => {
      const next = `${url}?t=${Date.now()}`;
      const img = new Image();
      img.onload = () => {
        setSrc(next);
        setFetchedAt(Date.now());
      };
      img.src = next;
    }, REFRESH_MS);
    return () => clearInterval(interval);
  }, [url]);

  useEffect(() => {
    const tick = setInterval(() => setAgo(Math.round((Date.now() - fetchedAt) / 1000)), 1000);
    return () => clearInterval(tick);
  }, [fetchedAt]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover live-kenburns" />
      {showTicker && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-gray-200 px-2 py-0.5 rounded text-[10px] font-mono pointer-events-none">
          refreshed {ago}s ago
        </div>
      )}
    </div>
  );
};

export default LiveFeedImage;
