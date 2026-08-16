import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, MapPin, Activity, Phone, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { API_BASE_URL } from '../config/api';
import { seekToPosterFrame } from '../config/video';
import LiveFeedImage from './LiveFeedImage';
import LiveStreamPlayer from './LiveStreamPlayer';

const VideoDetailView = ({ video, onClose }) => {
  // Recorded demo clips start paused so they can be played on cue during a demo.
  const isRecorded = !video?.isLive && Boolean(video?.filename);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();
  const [incidentDetails, setIncidentDetails] = useState(null);
  const videoRef = useRef(null);
  // Live detection result for recorded clips, polled against playback position
  const [detection, setDetection] = useState(null);
  // Recorded clips loop, so only auto-alert once per time the modal is open
  const autoAlertedRef = useRef(false);
  // Last observed playhead, used to notice a loop or a backward scrub
  const lastTimeRef = useRef(0);

  const location = video.coordinates
    ? { lat: video.coordinates.lat, lng: video.coordinates.lng, address: video.location }
    : { lat: 30.2672, lng: -97.7431, address: video.location };

  // Keyless Google Maps embed - works without an API key
  const mapEmbedUrl = `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`;

  const handleMapClick = () => {
    window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, '_blank');
  };

  // Sends the emergency alert. `overrides` lets the automatic detection path
  // describe the crash it just found instead of the current card state.
  const sendEmergencyAlert = async (overrides = {}, { automatic = false } = {}) => {
    try {
      const alertData = {
        type: overrides.type || incidentDetails?.type || 'Traffic Incident',
        location: video.location,
        severity: overrides.severity || incidentDetails?.severity || 'High',
        description:
          overrides.description ||
          incidentDetails?.description ||
          `Incident detected on ${video.name}`,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/api/security-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: automatic ? 'Collision Detected — Alerting Now' : 'Emergency Alert Sent',
          description:
            result.channel === 'discord'
              ? 'Posted to the Discord dispatch channel'
              : `Texted ${result.destination} — Status: ${result.status}`,
          className:
            'border border-red-500/30 bg-zinc-950/90 text-red-100 backdrop-blur-xl shadow-[0_0_40px_rgba(239,68,68,0.15)]',
        });
      } else {
        toast({
          title: 'Alert Failed',
          description: result.error || 'Failed to send emergency alert',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending security alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to send emergency alert. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSecurityAlert = () => sendEmergencyAlert();

  useEffect(() => {
    // Threat level comes from the detection system's per-crash assessment;
    // cameras with no active incident report None. For recorded clips the
    // assessment follows playback, so `detection` wins over the stale snapshot.
    const active = isRecorded ? Boolean(detection) : Boolean(video.hasIncident);
    const type = (isRecorded ? detection?.crash_type : video.incidentType) || 'collision';
    const severity =
      (isRecorded ? detection?.severity : video.threatLevel) || 'High';

    setIncidentDetails({
      type,
      severity: active ? severity : 'None',
      threatLevel: active ? severity : 'None',
      description: active
        ? `Traffic collision detected on ${video.name}. Emergency services have been notified.`
        : 'Traffic monitoring in progress. No incidents detected.',
      timestamp: new Date().toISOString(),
      location: video.location,
      confidence: (isRecorded ? detection?.confidence : video.confidence) || 0.95,
    });
  }, [video, detection, isRecorded]);

  // Recorded clips: follow playback position and auto-alert on the first impact.
  // Polls whether or not the clip is playing, matching the grid. Gating this on
  // isPlaying left the last result frozen on screen after a pause, and meant a
  // scrubbed position was never re-evaluated.
  useEffect(() => {
    if (!isRecorded) return;

    const interval = setInterval(async () => {
      const el = videoRef.current;
      if (!el) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/detect-crash/${video.filename}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentTime: el.currentTime }),
        });
        if (!response.ok) return;

        const result = await response.json();
        setDetection(result.has_crash ? result : null);

        if (result.has_crash && !autoAlertedRef.current) {
          autoAlertedRef.current = true;
          sendEmergencyAlert(
            {
              type: result.crash_type || 'collision',
              severity: result.severity || 'High',
              description: `AI detected ${result.crash_type || 'collision'} on ${video.name} at ${el.currentTime.toFixed(1)}s (confidence: ${Math.round((result.confidence || 0.95) * 100)}%)`,
            },
            { automatic: true }
          );
        }
      } catch (error) {
        console.error(`Detection error for ${video.filename}:`, error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRecorded, video.filename]);

  // Drive state from the element's own play/pause events rather than assuming
  // the toggle succeeded - play() returns a promise the browser can reject, and
  // flipping isPlaying optimistically left the button showing Pause over a clip
  // that never started.
  const togglePlayPause = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  // A loop back to the start, or a backward scrub, invalidates whatever the
  // detector last reported. Clearing it here rather than waiting for the next
  // 500ms poll stops COLLISION from lingering over the opening frames.
  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.currentTime < lastTimeRef.current - 0.25) setDetection(null);
    lastTimeRef.current = el.currentTime;
    setCurrentTime(el.currentTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getThreatColor = (threatLevel) => {
    switch (threatLevel) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-zinc-500';
    }
  };

  const getThreatCardClasses = (threatLevel) => {
    switch (threatLevel) {
      case 'High': return 'bg-red-600/20 border-red-500/30';
      case 'Medium': return 'bg-yellow-600/20 border-yellow-500/30';
      case 'Low': return 'bg-green-600/20 border-green-500/30';
      default: return 'bg-white/[0.04] border-white/10';
    }
  };

  if (!video) return null;

  const threatLevel = incidentDetails?.threatLevel || 'None';

  // Single source for every incident visual in this view. Recorded clips follow
  // the live detection poll; live feeds fall back to the flag on the record.
  // The `video` prop is a snapshot taken when the modal opened and never
  // updates, so reading hasIncident here would leave a recorded clip looking
  // clear no matter what the detector reports.
  const incidentActive = isRecorded ? Boolean(detection) : Boolean(video.hasIncident);
  const incidentLabel = ((isRecorded ? detection?.crash_type : video.incidentType) || 'collision')
    .toUpperCase()
    .replace('ROLLOVER', 'COLLISION');

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.7)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-medium tracking-wide text-white truncate">{video.name}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{video.location}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {incidentActive && (
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-red-300 animate-pulse">
                Incident
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/[0.06]"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feed */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-cyan-400/70" />
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
                    {video.isLive ? 'Live Feed' : 'Recorded Feed'}
                  </span>
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${video.status === 'online' ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                  {video.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              <div
                className={`relative aspect-video bg-black transition-shadow duration-300 ${
                  incidentActive ? 'ring-1 ring-red-500/50 shadow-[0_0_32px_rgba(239,68,68,0.18)]' : ''
                }`}
              >
                {video.isLive && video.streamUrl ? (
                  <LiveStreamPlayer src={video.streamUrl} tz={video.tz} className="w-full h-full object-cover" />
                ) : video.isLive && video.liveImageUrl ? (
                  <LiveFeedImage url={video.liveImageUrl} alt={video.name} className="w-full h-full" />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      src={`/Videos/${video.filename}`}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={(e) => seekToPosterFrame(e.currentTarget)}
                      onTimeUpdate={handleTimeUpdate}
                      onSeeked={() => setDetection(null)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-4 pb-2.5 pt-8">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={togglePlayPause}
                          className="rounded-full bg-black/60 border border-white/10 p-2 text-zinc-300 hover:text-white transition-colors"
                        >
                          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </button>
                        <span className="font-mono text-xs tabular-nums text-zinc-400">{formatTime(currentTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-black/60 px-2.5 py-1 backdrop-blur-md">
                        <span
                          className={`h-1 w-1 rounded-full ${
                            incidentActive ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'
                          }`}
                        />
                        <span
                          className={`text-[9px] font-mono uppercase tracking-[0.25em] ${
                            incidentActive ? 'text-red-300' : 'text-emerald-300'
                          }`}
                        >
                          {incidentActive ? 'Detected' : 'Analyzing'}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Incident overlay, mirroring the surveillance grid so a camera
                    reads the same whether it is a tile or opened in detail. */}
                {incidentActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-red-500/20">
                    <div className="text-center">
                      <AlertTriangle className="mx-auto mb-2 h-12 w-12 animate-pulse text-red-400" />
                      <p className="text-lg font-bold text-red-400">{incidentLabel}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Map */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-2.5">
                <MapPin className="h-3.5 w-3.5 text-cyan-400/70" />
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Location Map</span>
              </div>
              <div className="relative flex-1 min-h-[260px]">
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, position: 'absolute', inset: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map of ${video.name}`}
                />
                <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-red-600/90 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                  📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
              </div>
              <div className="border-t border-white/[0.05] p-3">
                <Button
                  onClick={handleMapClick}
                  variant="outline"
                  className="w-full bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:border-blue-400/50"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Open in Google Maps
                </Button>
              </div>
            </div>
          </div>

          {/* Key Information */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500 mb-4 text-center">
              Key Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Threat Level Card */}
              <div className={`${getThreatCardClasses(threatLevel)} border rounded-lg p-4 flex flex-col items-center justify-center backdrop-blur-sm`}>
                <div className={`${getThreatColor(threatLevel)} font-bold text-lg mb-2`}>
                  {threatLevel}
                </div>
                <div className="text-gray-300 text-sm text-center">Threat Level</div>
              </div>

              {/* Event Details Card */}
              <div className="bg-white/[0.04] border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-zinc-500 text-xs mb-2">Event Details</div>
                <div className="text-white text-sm leading-relaxed">
                  {incidentDetails?.description || 'Traffic monitoring in progress'}
                </div>
              </div>
            </div>

            {/* Emergency dispatch: recorded clips dial automatically on impact,
                live feeds are dispatched manually by the operator. */}
            <div className="mt-5 flex justify-center">
              {isRecorded ? (
                <div
                  className={`flex items-center gap-2 rounded-full border px-4 py-1.5 ${
                    detection
                      ? 'border-red-500/30 bg-red-500/10 text-red-300'
                      : 'border-white/10 bg-white/[0.04] text-zinc-500'
                  }`}
                >
                  <Phone className="h-3 w-3 shrink-0" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em]">
                    {detection ? 'Emergency alert sent' : 'Auto-dispatch armed'}
                  </span>
                </div>
              ) : (
                <Button
                  onClick={handleSecurityAlert}
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Alert Emergency Services
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailView;
