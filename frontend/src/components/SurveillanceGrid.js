import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, Wifi, WifiOff, Play, Pause, Square, Eye, AlertCircle } from 'lucide-react';

const SurveillanceGrid = ({ onIncidentDetected }) => {
  const [videos, setVideos] = useState([]);
  const [detectionActive, setDetectionActive] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({
    totalCameras: 0,
    onlineCameras: 0,
    totalIncidents: 0,
    activeIncidents: 0
  });

  // Mock video feeds with different scenarios
  const mockVideoFeeds = [
    {
      id: 1,
      name: 'Highway 101 - Northbound',
      location: 'Highway 101, Mile 45.2, San Francisco, CA',
      status: 'online',
      hasIncident: false,
      incidentType: null,
      objectsCount: 3,
      lastDetection: null
    },
    {
      id: 2,
      name: 'I-280 - Southbound',
      location: 'I-280, Exit 12, San Jose, CA',
      status: 'online',
      hasIncident: false,
      incidentType: null,
      objectsCount: 2,
      lastDetection: null
    },
    {
      id: 3,
      name: 'Highway 880 - Eastbound',
      location: 'Highway 880, Oakland, CA',
      status: 'online',
      hasIncident: false,
      incidentType: null,
      objectsCount: 1,
      lastDetection: null
    },
    {
      id: 4,
      name: 'Highway 5 - Northbound',
      location: 'Highway 5, Sacramento, CA',
      status: 'online',
      hasIncident: false,
      incidentType: null,
      objectsCount: 4,
      lastDetection: null
    },
    {
      id: 5,
      name: 'Highway 101 - Southbound',
      location: 'Highway 101, Palo Alto, CA',
      status: 'offline',
      hasIncident: false,
      incidentType: null,
      objectsCount: 0,
      lastDetection: null
    },
    {
      id: 6,
      name: 'I-80 - Westbound',
      location: 'I-80, Berkeley, CA',
      status: 'online',
      hasIncident: false,
      incidentType: null,
      objectsCount: 2,
      lastDetection: null
    }
  ];

  useEffect(() => {
    setVideos(mockVideoFeeds);
    setStats({
      totalCameras: mockVideoFeeds.length,
      onlineCameras: mockVideoFeeds.filter(v => v.status === 'online').length,
      totalIncidents: 0,
      activeIncidents: 0
    });
  }, []);

  // Simulate real-time detection
  useEffect(() => {
    if (!detectionActive) return;

    const interval = setInterval(() => {
      setVideos(prevVideos => {
        return prevVideos.map(video => {
          // Simulate random incident detection (5% chance per video)
          if (Math.random() < 0.05 && video.status === 'online') {
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

          // Update objects count randomly
          return {
            ...video,
            objectsCount: video.status === 'online' ? Math.floor(Math.random() * 5) + 1 : 0
          };
        });
      });
    }, 2000);

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

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <Card 
            key={video.id} 
            className={`relative overflow-hidden transition-all duration-300 ${
              video.hasIncident 
                ? 'ring-4 ring-red-500 animate-pulse bg-red-900/20' 
                : 'bg-gray-800 border-gray-700'
            }`}
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
                  <Button size="sm" variant="ghost" className="text-gray-400">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {/* Video Placeholder */}
              <div className="relative bg-black h-48 flex items-center justify-center">
                {video.status === 'online' ? (
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

                {/* Detection Boxes (Mock) */}
                {video.status === 'online' && video.objectsCount > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: video.objectsCount }).map((_, i) => (
                      <div
                        key={i}
                        className={`absolute border-2 ${
                          video.hasIncident ? 'border-red-500' : 'border-green-500'
                        } bg-${video.hasIncident ? 'red' : 'green'}-500/20`}
                        style={{
                          left: `${20 + i * 25}%`,
                          top: `${30 + i * 15}%`,
                          width: '15%',
                          height: '20%'
                        }}
                      />
                    ))}
                  </div>
                )}
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
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Incidents</h3>
          <div className="space-y-3">
            {incidents.slice(0, 5).map((incident) => (
              <Card key={incident.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="destructive" className="animate-pulse">
                          {incident.type?.toUpperCase() || 'INCIDENT'}
                        </Badge>
                        <span className="text-gray-400 text-sm">
                          {incident.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-white text-sm mb-1">{incident.description}</p>
                      <p className="text-gray-400 text-xs">{incident.location}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dismissIncident(incident.id)}
                        className="text-gray-400 border-gray-600"
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
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
    </div>
  );
};

export default SurveillanceGrid;
