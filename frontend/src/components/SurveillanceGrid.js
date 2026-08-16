import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, Wifi, WifiOff, Eye, MapPin, Play, Pause } from 'lucide-react';
import CameraLocationMap from './CameraLocationMap';
import { API_BASE_URL } from '../config/api';
import { seekToPosterFrame } from '../config/video';
import LiveFeedImage from './LiveFeedImage';
import LiveStreamPlayer from './LiveStreamPlayer';

const SurveillanceGrid = ({ onIncidentDetected, onVideoClick }) => {
  // Detection runs automatically - no manual start/stop
  const [detectionActive] = useState(true);
  const [videos, setVideos] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  // Recorded tiles stay paused until played, so a demo starts from a still frame
  const [playingIds, setPlayingIds] = useState(() => new Set());

  // The element's own play/pause events maintain playingIds, so this only asks.
  // Updating the set here as well assumed play() succeeded, which left a tile
  // showing Pause when the browser refused to start it.
  const toggleTilePlayback = (video, e) => {
    e.stopPropagation();
    const el = document.querySelector(`video[data-cam-id="${video.id}"]`);
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  useEffect(() => {
    // Load real video data from API
    const loadVideos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/videos`);
        const realVideos = await response.json();
        const formattedVideos = realVideos.map(video => ({
          ...video,
          lastDetection: video.lastDetection ? new Date(video.lastDetection) : null
        }));
        setVideos(formattedVideos);
      } catch (error) {
        console.error('Failed to load videos:', error);
        setVideos([]);
      }
    };

    loadVideos();
  }, []);

  // Real-time detection against the backend analysis service.
  // Use refs to track state without re-subscribing intervals.
  const videosRef = useRef(videos);
  videosRef.current = videos;
  // Cameras that have already fired an alert this session
  const alertedRef = useRef(new Set());

  useEffect(() => {
    if (!detectionActive) return;
    if (videosRef.current.length === 0) return;

    const detectionIntervals = {};

    videosRef.current.forEach(video => {
      if (video.status !== 'online' || !video.filename) return;

      // Only recorded incident-demo cameras have analysis data
      const isKnownCrashVideo = video.filename && video.filename.startsWith('V');
      if (!isKnownCrashVideo) return;

      detectionIntervals[video.id] = setInterval(async () => {
        try {
          // Read the actual playback position of this camera's video element
          // so detection stays in sync with the looping footage.
          const el = document.querySelector(`video[data-cam-id="${video.id}"]`);
          const currentTime = el ? el.currentTime : 0;

          const response = await fetch(`${API_BASE_URL}/api/detect-crash/${video.filename}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ currentTime })
          });

          if (response.ok) {
            const detection = await response.json();

            if (detection.has_crash) {
              // Flag the incident while the impact is on screen
              setVideos(prevVideos =>
                prevVideos.map(v =>
                  v.id === video.id && !v.hasIncident
                    ? {
                        ...v,
                        hasIncident: true,
                        incidentType: detection.crash_type,
                        confidence: detection.confidence,
                        threatLevel: detection.severity || 'High',
                      }
                    : v
                )
              );

              // Alert once per camera per session, not on every loop
              if (!alertedRef.current.has(video.id)) {
                alertedRef.current.add(video.id);
                const newIncident = {
                  id: Date.now() + Math.random(),
                  videoId: video.id,
                  type: detection.crash_type || 'collision',
                  severity: detection.severity || 'High',
                  location: video.location,
                  description: `AI detected ${detection.crash_type || 'collision'} on ${video.name} at ${currentTime.toFixed(1)}s (confidence: ${Math.round(detection.confidence * 100)}%)`,
                  timestamp: new Date(),
                  status: 'active',
                  confidence: detection.confidence
                };
                setIncidents(prev => [newIncident, ...prev]);
                onIncidentDetected?.(newIncident);
              }
            } else {
              // Footage looped back to before the impact - clear the incident overlay
              setVideos(prevVideos =>
                prevVideos.map(v =>
                  v.id === video.id && v.hasIncident
                    ? { ...v, hasIncident: false, incidentType: null, confidence: null, threatLevel: null }
                    : v
                )
              );
            }
          }
        } catch (error) {
          console.error(`Detection error for ${video.filename}:`, error);
        }
      }, 500);
    });

    return () => {
      Object.values(detectionIntervals).forEach(interval => clearInterval(interval));
    };
  }, [detectionActive, onIncidentDetected, videos.length]);

  const dismissIncident = (incidentId) => {
    const incidentToDismiss = incidents.find(incident => incident.id === incidentId);
    setIncidents(prev => prev.filter(incident => incident.id !== incidentId));
    if (incidentToDismiss) {
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === incidentToDismiss.videoId
            ? { ...video, hasIncident: false, incidentType: null, confidence: null, threatLevel: null }
            : video
        )
      );
    }
  };

  const handleLocationClick = (video, e) => {
    e.stopPropagation();
    setSelectedCamera(video);
  };

  // Distinct states across the network, from the trailing ", XX" of each location
  const stateCount = new Set(
    videos
      .map(v => (v.location || '').trim().match(/,\s*([A-Z]{2})$/)?.[1])
      .filter(Boolean)
  ).size;

  const getIncidentLabel = (incidentType) => {
    switch (incidentType) {
      case 'collision': return 'COLLISION';
      case 'rollover': return 'COLLISION';
      case 'fire': return 'VEHICLE FIRE';
      case 'debris': return 'DEBRIS';
      default: return 'COLLISION';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-5">
          <h2 className="text-sm font-medium tracking-[0.35em] text-zinc-200 uppercase">
            Surveillance Network
          </h2>
          <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3.5 py-1">
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-300">
              AI Detection Active
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
          {videos.length} channels · {stateCount} states
        </span>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-3 gap-5">
        {videos.map((video) => (
          <Card
            key={video.id}
            className={`group relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${
              video.hasIncident
                ? 'ring-1 ring-red-500/40 border-red-500/30 bg-red-950/10 shadow-[0_0_32px_rgba(239,68,68,0.12)]'
                : 'bg-white/[0.03] border-white/[0.06] hover:border-cyan-400/25 hover:bg-white/[0.05] hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
            }`}
            onClick={() => onVideoClick?.(video)}
          >
            <CardHeader className="py-2.5 px-3.5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-[13px] font-medium tracking-wide text-zinc-200 truncate">
                  {video.status === 'online' ? (
                    <Wifi className="w-3.5 h-3.5 mr-2 shrink-0 text-emerald-400/70" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 mr-2 shrink-0 text-red-400/70" />
                  )}
                  <span className="truncate">{video.name}</span>
                </CardTitle>
                <div className="flex items-center shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
                    onClick={(e) => handleLocationClick(video, e)}
                    title="View location on map"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
                    title="View details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Video Player - 16:9 */}
              <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                {video.isLive && video.streamUrl ? (
                  <LiveStreamPlayer
                    src={video.streamUrl}
                    className="w-full h-full object-cover"
                  />
                ) : video.isLive && video.liveImageUrl ? (
                  <LiveFeedImage
                    url={video.liveImageUrl}
                    alt={video.name}
                    className="w-full h-full"
                  />
                ) : video.status === 'online' && video.filename ? (
                  <>
                    <video
                      data-cam-id={video.id}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={(e) => seekToPosterFrame(e.currentTarget)}
                      onPlay={() => setPlayingIds(p => new Set(p).add(video.id))}
                      onPause={() =>
                        setPlayingIds(p => {
                          const n = new Set(p);
                          n.delete(video.id);
                          return n;
                        })
                      }
                    >
                      <source src={`/Videos/${video.filename}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <button
                      type="button"
                      onClick={(e) => toggleTilePlayback(video, e)}
                      title={playingIds.has(video.id) ? 'Pause clip' : 'Play clip'}
                      className="absolute bottom-2.5 left-2.5 rounded-full border border-white/15 bg-black/70 p-2 text-zinc-200 backdrop-blur-md transition-colors hover:text-white hover:border-cyan-400/40"
                    >
                      {playingIds.has(video.id) ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </>
                ) : video.status === 'online' ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-sm">Live Feed</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 text-sm">Offline</p>
                  </div>
                )}

                {/* AI Analysis Indicator */}
                {detectionActive && video.status === 'online' && !video.hasIncident && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-black/60 backdrop-blur-md px-2.5 py-1">
                    <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-emerald-300">Analyzing</span>
                  </div>
                )}

                {/* Incident Overlay */}
                {video.hasIncident && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-red-400 font-bold text-lg">
                        {getIncidentLabel(video.incidentType)}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Video Info */}
              <div className="p-3.5 border-t border-white/[0.04]">
                <p className="text-zinc-400 text-xs mb-1.5 truncate">{video.location}</p>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em]">
                  <span className={video.isLive ? 'text-red-400/90' : 'text-cyan-400/80'}>
                    {video.isLive ? 'Live feed' : 'Recorded feed'}
                  </span>
                  {video.lastDetection && (
                    <span className="text-amber-300/70 tabular-nums">
                      {video.lastDetection.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Incidents */}
      {incidents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-medium tracking-[0.3em] text-zinc-200 uppercase">
              Active Incidents
            </h3>
            <Badge variant="destructive" className="animate-pulse">{incidents.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.map((incident) => (
              <Card key={incident.id} className="bg-white/[0.03] border-white/[0.08] rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-red-400 font-semibold text-sm uppercase tracking-wide">
                        {getIncidentLabel(incident.type)}
                      </p>
                      <p className="text-zinc-400 text-xs mt-1">{incident.location}</p>
                      <p className="text-zinc-600 text-[10px] font-mono mt-1 tabular-nums">
                        {incident.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="destructive">{incident.severity}</Badge>
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dismissIncident(incident.id)}
                      className="flex-1 bg-white text-black border-gray-300 hover:bg-zinc-200 hover:text-black transition-colors"
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const cam = videos.find(v => v.id === incident.videoId);
                        if (cam) onVideoClick?.(cam);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      View Camera
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Camera Location Map Modal */}
      {selectedCamera && (
        <CameraLocationMap
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      )}
    </div>
  );
};

export default SurveillanceGrid;
