import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, Wifi, WifiOff, Play, Pause, Square, Eye, AlertCircle, MapPin } from 'lucide-react';
import CameraLocationMap from './CameraLocationMap';

const SurveillanceGrid = ({ onIncidentDetected, onVideoClick }) => {
  const [videos, setVideos] = useState([]);
  const [detectionActive, setDetectionActive] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [stats, setStats] = useState({
    totalCameras: 0,
    onlineCameras: 0,
    totalIncidents: 0,
    activeIncidents: 0
  });

  // Mock video feeds with different crash scenarios
  const mockVideoFeeds = [
    {
      id: 1,
      name: 'Highway 101 - Northbound',
      location: 'Highway 101, Mile 45.2, San Francisco, CA',
      coordinates: { lat: 37.7749, lng: -122.4194 },
      status: 'online',
      hasIncident: true,
      incidentType: 'collision',
      objectsCount: 4,
      lastDetection: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      crashDetails: {
        type: 'Multi-vehicle collision',
        severity: 'Critical',
        vehiclesInvolved: 3,
        injuries: 'Multiple injuries reported',
        description: 'Three vehicles involved in high-speed collision with debris scattered across lanes'
      }
    },
    {
      id: 2,
      name: 'I-280 - Southbound',
      location: 'I-280, Exit 12, San Jose, CA',
      coordinates: { lat: 37.3382, lng: -121.8863 },
      status: 'online',
      hasIncident: false,
      incidentType: null,
      objectsCount: 2,
      lastDetection: null,
      crashDetails: null
    },
    {
      id: 3,
      name: 'Highway 880 - Eastbound',
      location: 'Highway 880, Oakland, CA',
      coordinates: { lat: 37.8044, lng: -122.2712 },
      status: 'online',
      hasIncident: true,
      incidentType: 'fire',
      objectsCount: 1,
      lastDetection: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      crashDetails: {
        type: 'Vehicle fire',
        severity: 'High',
        vehiclesInvolved: 1,
        injuries: 'Driver evacuated safely',
        description: 'Vehicle fire with visible flames and smoke'
      }
    },
    {
      id: 4,
      name: 'Highway 5 - Northbound',
      location: 'Highway 5, Sacramento, CA',
      coordinates: { lat: 38.5816, lng: -121.4944 },
      status: 'online',
      hasIncident: false,
      incidentType: null,
      objectsCount: 3,
      lastDetection: null,
      crashDetails: null
    },
    {
      id: 5,
      name: 'Highway 101 - Southbound',
      location: 'Highway 101, Palo Alto, CA',
      coordinates: { lat: 37.4419, lng: -122.1430 },
      status: 'offline',
      hasIncident: false,
      incidentType: null,
      objectsCount: 0,
      lastDetection: null,
      crashDetails: null
    },
    {
      id: 6,
      name: 'I-80 - Westbound',
      location: 'I-80, Berkeley, CA',
      coordinates: { lat: 37.8715, lng: -122.2730 },
      status: 'online',
      hasIncident: true,
      incidentType: 'breakdown',
      objectsCount: 2,
      lastDetection: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
      crashDetails: {
        type: 'Vehicle breakdown with debris',
        severity: 'Medium',
        vehiclesInvolved: 1,
        injuries: 'No injuries reported',
        description: 'Vehicle breakdown with debris on roadway causing traffic backup'
      }
    },
    {
      id: 7,
      name: 'Highway 17 - Northbound',
      location: 'Highway 17, Santa Cruz, CA',
      coordinates: { lat: 36.9741, lng: -122.0308 },
      status: 'online',
      hasIncident: false,
      incidentType: null,
      objectsCount: 1,
      lastDetection: null,
      crashDetails: null
    },
    {
      id: 8,
      name: 'I-580 - Eastbound',
      location: 'I-580, Livermore, CA',
      coordinates: { lat: 37.6819, lng: -121.7680 },
      status: 'online',
      hasIncident: true,
      incidentType: 'fire',
      objectsCount: 3,
      lastDetection: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      crashDetails: {
        type: 'Vehicle fire with smoke',
        severity: 'High',
        vehiclesInvolved: 1,
        injuries: 'Driver evacuated safely',
        description: 'Vehicle fire with visible flames and heavy smoke'
      }
    },
    {
      id: 9,
      name: 'Highway 92 - Westbound',
      location: 'Highway 92, Half Moon Bay, CA',
      coordinates: { lat: 37.4636, lng: -122.4285 },
      status: 'offline',
      hasIncident: false,
      incidentType: null,
      objectsCount: 0,
      lastDetection: null,
      crashDetails: null
    }
  ];

  useEffect(() => {
    // Load real video data from API
    const loadVideos = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/videos');
        const realVideos = await response.json();
        
        // Convert API data to component format
        const formattedVideos = realVideos.map(video => ({
          ...video,
          lastDetection: video.lastDetection ? new Date(video.lastDetection) : null
        }));
        
        setVideos(formattedVideos);
        setStats({
          totalCameras: formattedVideos.length,
          onlineCameras: formattedVideos.filter(v => v.status === 'online').length,
          totalIncidents: formattedVideos.filter(v => v.hasIncident).length,
          activeIncidents: formattedVideos.filter(v => v.hasIncident).length
        });
      } catch (error) {
        console.error('Failed to load videos:', error);
        // Fallback to mock data
        setVideos(mockVideoFeeds);
        setStats({
          totalCameras: mockVideoFeeds.length,
          onlineCameras: mockVideoFeeds.filter(v => v.status === 'online').length,
          totalIncidents: 0,
          activeIncidents: 0
        });
      }
    };
    
    loadVideos();
  }, []);

  // Real-time detection with realistic CCTV behavior
  useEffect(() => {
    if (!detectionActive) return;

    let frameCounter = 0;
    const interval = setInterval(() => {
      frameCounter++;
      
      setVideos(prevVideos => {
        return prevVideos.map(video => {
          if (video.status !== 'online') return video;

          // Only detect crashes for V videos (known crash videos) and very rarely
          const isKnownCrashVideo = video.filename && video.filename.startsWith('V');
          
          // Very low chance of detecting crash (only for known crash videos)
          // Make it more realistic - crashes happen after some time
          if (isKnownCrashVideo && frameCounter > 20 && Math.random() < 0.01) {
            const incidentTypes = ['collision', 'breakdown', 'fire', 'debris'];
            const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
            
            const newIncident = {
              id: Date.now() + Math.random(),
              videoId: video.id,
              type: incidentType,
              severity: 'high',
              location: video.location,
              description: `Detected ${incidentType} on ${video.name}`,
              timestamp: new Date(),
              status: 'active'
            };

            setIncidents(prev => [newIncident, ...prev]);
            onIncidentDetected?.(newIncident);

            return {
              ...video,
              hasIncident: true,
              incidentType,
              lastDetection: new Date()
            };
          }

          // Update objects count with realistic movement
          const baseCount = video.filename && video.filename.startsWith('V') ? 2 : 1;
          const variation = Math.floor(Math.random() * 2);
          const newCount = Math.max(1, baseCount + variation);

          return {
            ...video,
            objectsCount: newCount
          };
        });
      });
    }, 2000); // More realistic timing

    return () => clearInterval(interval);
  }, [detectionActive, onIncidentDetected]);

  const startDetection = () => {
    setDetectionActive(true);
  };

  const stopDetection = () => {
    setDetectionActive(false);
  };

  const dismissIncident = (incidentId) => {
    setIncidents(prev => prev.filter(incident => incident.id !== incidentId));
    setVideos(prev => prev.map(video => ({
      ...video,
      hasIncident: false,
      incidentType: null
    })));
  };

  const handleLocationClick = (video, e) => {
    e.stopPropagation(); // Prevent triggering the video click
    setSelectedCamera(video);
    setShowLocationMap(true);
  };

  const closeLocationMap = () => {
    setShowLocationMap(false);
    setSelectedCamera(null);
  };

  const getIncidentColor = (incidentType) => {
    switch (incidentType) {
      case 'collision': return 'bg-red-500';
      case 'fire': return 'bg-orange-500';
      case 'breakdown': return 'bg-yellow-500';
      case 'debris': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getIncidentLabel = (incidentType) => {
    switch (incidentType) {
      case 'collision': return 'COLLISION';
      case 'fire': return 'FIRE';
      case 'breakdown': return 'BREAKDOWN';
      case 'debris': return 'DEBRIS';
      default: return 'INCIDENT';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Surveillance Grid</h2>
          <Badge variant={detectionActive ? "destructive" : "secondary"} className="animate-pulse">
            {detectionActive ? 'DETECTING' : 'OFFLINE'}
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={detectionActive ? stopDetection : startDetection}
            variant={detectionActive ? "destructive" : "default"}
            size="sm"
          >
            {detectionActive ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Detection
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Detection
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Camera Status */}
      <div className="flex items-center space-x-4 text-sm text-gray-300">
        <span>Cameras {stats.onlineCameras} / {stats.totalCameras} online</span>
        <span>•</span>
        <span>Active Incidents: {incidents.filter(i => i.status === 'active').length}</span>
        <span>•</span>
        <span>Total Detections: {incidents.length}</span>
      </div>

      {/* Video Grid - 3x3 Layout */}
      <div className="grid grid-cols-3 gap-4">
        {videos.map((video) => (
          <Card 
            key={video.id} 
            className={`relative overflow-hidden transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl ${
              video.hasIncident 
                ? 'ring-2 ring-red-500/30 border-red-500/40 bg-red-900/10' 
                : 'bg-gray-800/80 border-gray-700/50 hover:border-gray-600 hover:bg-gray-800'
            }`}
            onClick={() => onVideoClick?.(video)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white flex items-center">
                  {video.status === 'online' ? (
                    <Wifi className="w-4 h-4 mr-2 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 mr-2 text-red-400" />
                  )}
                  {video.name}
                </CardTitle>
                <div className="flex items-center space-x-1">
                  {video.hasIncident && (
                    <Badge variant="destructive" className="animate-pulse">
                      {getIncidentLabel(video.incidentType)}
                    </Badge>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    onClick={(e) => handleLocationClick(video, e)}
                    title="View location on map"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {/* Video Player - Clean, no blur */}
              <div className="relative bg-black h-48 flex items-center justify-center overflow-hidden">
                {video.status === 'online' && video.filename ? (
                  <video
                    className="w-full h-full object-cover"
                    muted
                    loop
                    autoPlay
                    playsInline
                  >
                    <source src={`/Videos/${video.filename}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : video.status === 'online' ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-sm">Live Feed</p>
                    <p className="text-green-400 text-xs">Objects: {video.objectsCount}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 text-sm">Offline</p>
                  </div>
                )}

                {/* Incident Overlay */}
                {video.hasIncident && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <div className="text-center">
                      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-red-400 font-bold text-lg">
                        {getIncidentLabel(video.incidentType)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Moving Detection Boxes */}
                {video.status === 'online' && video.objectsCount > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: video.objectsCount }).map((_, i) => {
                      // Create moving bounding boxes that simulate car tracking
                      const time = Date.now() / 1000;
                      const baseX = 20 + i * 30;
                      const baseY = 30 + i * 20;
                      const moveX = Math.sin(time + i) * 10;
                      const moveY = Math.cos(time + i * 0.5) * 5;
                      
                      return (
                        <div
                          key={i}
                          className={`absolute border-2 transition-all duration-300 ${
                            video.hasIncident ? 'border-red-500' : 'border-green-500'
                          } ${video.hasIncident ? 'bg-red-500/20' : 'bg-green-500/20'}`}
                          style={{
                            left: `${Math.max(5, Math.min(85, baseX + moveX))}%`,
                            top: `${Math.max(10, Math.min(80, baseY + moveY))}%`,
                            width: '12%',
                            height: '18%'
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Objects Count Overlay */}
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Objects: {video.objectsCount}
                </div>
              </div>

              {/* Video Info */}
              <div className="p-3 bg-gray-800">
                <p className="text-gray-300 text-xs mb-1">{video.location}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Objects: {video.objectsCount}
                  </span>
                  {video.lastDetection && (
                    <span className="text-yellow-400">
                      Last: {video.lastDetection.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Incidents Sidebar */}
      {incidents.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Recent Incidents</h3>
            <Badge variant="destructive" className="animate-pulse">
              {incidents.length} Active
            </Badge>
          </div>
          <div className="space-y-4">
            {incidents.slice(0, 5).map((incident) => (
              <Card key={incident.id} className="bg-gray-800/90 border-gray-700/50 hover:bg-gray-800 transition-all duration-200 shadow-lg">
                <CardContent className="p-5">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="destructive" className="animate-pulse bg-red-600 text-white font-semibold">
                          {incident.type?.toUpperCase() || 'INCIDENT'}
                        </Badge>
                        <span className="text-gray-300 text-sm font-medium">
                          {incident.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Description */}
                    <div className="space-y-2">
                      <p className="text-white text-sm leading-relaxed font-medium">
                        {incident.description}
                      </p>
                      <p className="text-gray-400 text-xs flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {incident.location}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dismissIncident(incident.id)}
                        className="flex-1 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                      >
                        Alert Security
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Location Map Modal */}
      {showLocationMap && selectedCamera && (
        <CameraLocationMap 
          camera={selectedCamera} 
          onClose={closeLocationMap} 
        />
      )}
    </div>
  );
};

export default SurveillanceGrid;
