import React, { useState, useEffect } from 'react';
import SurveillanceGrid from '../components/SurveillanceGrid';
import VideoDetailView from '../components/VideoDetailView';
import { useToast } from '../hooks/use-toast';
import OculonLogo from '../components/OculonLogo';

const Dashboard = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoDetail, setShowVideoDetail] = useState(false);
  const [clock, setClock] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    const tick = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Handle incident detection from surveillance grid
  const handleIncidentDetected = (incident) => {
    // The detector reports lowercase types ("collision"); capitalise it since it
    // opens the sentence.
    const incidentType = incident.type
      ? incident.type.charAt(0).toUpperCase() + incident.type.slice(1)
      : 'Incident';
    toast({
      title: 'Traffic Incident Detected',
      description: `${incidentType} detected on ${incident.location}. Emergency services have been notified.`,
      duration: 6000,
      className:
        'border border-red-500/30 bg-zinc-950/90 text-red-100 backdrop-blur-xl shadow-[0_0_40px_rgba(239,68,68,0.15)]',
    });
  };

  // Handle video click
  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setShowVideoDetail(true);
  };

  // Close video detail view
  const closeVideoDetail = () => {
    setShowVideoDetail(false);
    setSelectedVideo(null);
  };

  return (
    <div className="relative min-h-screen bg-[#09090b]">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(34,211,238,0.07),transparent_70%)]"
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090b]/75 backdrop-blur-xl px-8 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-4">
            <OculonLogo className="w-10 h-10 drop-shadow-[0_0_12px_rgba(34,211,238,0.45)]" />
            <div>
              <h1 className="text-lg font-light tracking-[0.45em] text-white uppercase leading-none">
                Oculon
              </h1>
              <p className="mt-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                AI Traffic Incident Detection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-300">
                System Online
              </span>
            </div>
            <span className="font-mono text-sm font-medium text-zinc-400 tabular-nums tracking-wider">
              {clock.toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative p-8 max-w-[1600px] mx-auto">
        <SurveillanceGrid
          onIncidentDetected={handleIncidentDetected}
          onVideoClick={handleVideoClick}
        />
      </div>

      {/* Video Detail Modal */}
      {showVideoDetail && selectedVideo && (
        <VideoDetailView video={selectedVideo} onClose={closeVideoDetail} />
      )}
    </div>
  );
};

export default Dashboard;
