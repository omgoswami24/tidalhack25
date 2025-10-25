import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { X, Play, Pause, Square, AlertTriangle, MapPin, Clock, Activity, Users, Zap, ExternalLink } from 'lucide-react';
import { getEmbedMapUrl, getStaticMapUrl } from '../config/maps';

const VideoDetailView = ({ video, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [detections, setDetections] = useState([]);
  const [incidentDetails, setIncidentDetails] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const videoRef = useRef(null);

  // Camera location data with coordinates
  const cameraLocations = {
    'Highway 101 - Northbound': {
      lat: 37.7749,
      lng: -122.4194,
      address: 'Highway 101, Mile 45.2, San Francisco, CA'
    },
    'I-280 - Southbound': {
      lat: 37.3382,
      lng: -121.8863,
      address: 'I-280, Exit 12, San Jose, CA'
    },
    'Highway 880 - Eastbound': {
      lat: 37.8044,
      lng: -122.2712,
      address: 'Highway 880, Oakland, CA'
    },
    'Highway 5 - Northbound': {
      lat: 38.5816,
      lng: -121.4944,
      address: 'Highway 5, Sacramento, CA'
    },
    'Highway 101 - Southbound': {
      lat: 37.4419,
      lng: -122.1430,
      address: 'Highway 101, Palo Alto, CA'
    },
    'I-80 - Westbound': {
      lat: 37.8715,
      lng: -122.2730,
      address: 'I-80, Berkeley, CA'
    },
    'Highway 17 - Northbound': {
      lat: 36.9741,
      lng: -122.0308,
      address: 'Highway 17, Santa Cruz, CA'
    },
    'I-580 - Eastbound': {
      lat: 37.6819,
      lng: -121.7680,
      address: 'I-580, Livermore, CA'
    },
    'Highway 92 - Westbound': {
      lat: 37.4636,
      lng: -122.4285,
      address: 'Highway 92, Half Moon Bay, CA'
    }
  };

  // Get location data for current video
  const location = cameraLocations[video.name] || {
    lat: 37.7749,
    lng: -122.4194,
    address: video.location
  };

  // Generate Google Maps URLs
  const mapEmbedUrl = getEmbedMapUrl(location.lat, location.lng);
  const staticMapUrl = getStaticMapUrl(location.lat, location.lng);
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;

  const handleMapClick = () => {
    window.open(searchUrl, '_blank');
  };

  // Mock detection data for the selected video
  useEffect(() => {
    if (video) {
      // Generate mock detections based on video
      const mockDetections = generateMockDetections(video);
      setDetections(mockDetections);
      
      // Generate incident details if video has incident
      if (video.hasIncident) {
        setIncidentDetails(generateIncidentDetails(video));
      }
    }
  }, [video]);

  const generateMockDetections = (video) => {
    const detections = [];
    const numDetections = Math.floor(Math.random() * 8) + 3;
    
    for (let i = 0; i < numDetections; i++) {
      detections.push({
        id: i,
        timestamp: new Date(Date.now() - Math.random() * 300000), // Random time in last 5 minutes
        type: ['Vehicle', 'Person', 'Debris', 'Fire', 'Smoke'][Math.floor(Math.random() * 5)],
        confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
        location: {
          x: Math.random() * 80 + 10, // 10-90% of video width
          y: Math.random() * 80 + 10, // 10-90% of video height
          width: Math.random() * 20 + 10, // 10-30% width
          height: Math.random() * 20 + 10 // 10-30% height
        },
        description: generateDetectionDescription()
      });
    }
    
    return detections.sort((a, b) => b.timestamp - a.timestamp);
  };

  const generateDetectionDescription = () => {
    const descriptions = [
      'Vehicle detected moving at high speed',
      'Multiple vehicles in close proximity',
      'Debris scattered across roadway',
      'Smoke visible from vehicle',
      'Person detected near traffic',
      'Vehicle appears to be stationary',
      'Unusual vehicle orientation detected',
      'Bright flash detected'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const generateIncidentDetails = (video) => {
    return {
      type: video.incidentType || 'collision',
      severity: 'Critical',
      threatLevel: 'High',
      description: `Traffic incident detected on ${video.name}`,
      location: video.location,
      timestamp: new Date(),
      confidence: 0.95,
      responseTime: '2-3 minutes',
      emergencyServices: ['Police', 'Ambulance', 'Fire Department'],
      additionalInfo: [
        'Multiple vehicles involved in collision',
        'Debris scattered across multiple lanes',
        'Traffic backup extending 2 miles',
        'Emergency services dispatched'
      ]
    };
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getThreatColor = (level) => {
    switch (level) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (!video) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-gray-900/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl w-full max-w-7xl h-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div>
            <h2 className="text-2xl font-bold text-white">Hello SafeSight, here are the details of your detection.</h2>
            <p className="text-gray-200 mt-1 font-medium">{video.name} - {video.location}</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Main Content Grid - 2x2 Layout */}
        <div className="grid grid-cols-2 grid-rows-2 h-[calc(100vh-120px)] gap-6 p-6">
          {/* Live Camera Feed - Top Left (50% width, 50% height) */}
          <div className="col-span-1 row-span-1">
            <Card className="bg-gray-800/80 border-gray-700/50 h-full backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl flex items-center">
                    <Activity className="w-6 h-6 mr-3" />
                    Live Camera Feed
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant={video.status === 'online' ? 'default' : 'secondary'} className="bg-green-600 text-white">
                      {video.status === 'online' ? 'Real-time' : 'OFFLINE'}
                    </Badge>
                    {video.hasIncident && (
                      <Badge variant="destructive" className="animate-pulse bg-red-600">
                        INCIDENT DETECTED
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-full p-0">
                <div className="relative bg-black rounded-lg h-full overflow-hidden">
                  {/* Video Player Placeholder */}
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-700/80 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-sm">
                        {isPlaying ? (
                          <Pause className="w-12 h-12 text-white" />
                        ) : (
                          <Play className="w-12 h-12 text-white" />
                        )}
                      </div>
                      <p className="text-gray-200 mb-3 font-medium text-lg">Camera Feed: {video.name}</p>
                      <p className="text-sm text-gray-300">Objects Detected: {video.objectsCount}</p>
                    </div>
                  </div>

                  {/* Detection Overlays */}
                  {detections.map((detection, index) => (
                    <div
                      key={detection.id}
                      className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none rounded"
                      style={{
                        left: `${detection.location.x}%`,
                        top: `${detection.location.y}%`,
                        width: `${detection.location.width}%`,
                        height: `${detection.location.height}%`
                      }}
                    >
                      <div className="absolute -top-8 left-0 text-xs text-red-400 font-semibold bg-black/70 px-2 py-1 rounded">
                        {detection.type} ({Math.round(detection.confidence * 100)}%)
                      </div>
                    </div>
                  ))}

                  {/* Video Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-4">
                    <Button
                      onClick={togglePlayPause}
                      size="sm"
                      variant="secondary"
                      className="bg-black/70 hover:bg-black/90 backdrop-blur-sm"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <div className="flex-1 bg-gray-600/70 rounded-full h-2 backdrop-blur-sm">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">{formatTime(currentTime)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Camera Location - Top Right (50% width, 50% height) */}
          <div className="col-span-1 row-span-1">
            <Card className="bg-gray-800/80 border-gray-700/50 h-full backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Camera Location
                  </CardTitle>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </CardHeader>
              <CardContent className="h-full p-0">
                <div className="relative bg-gray-700 rounded-lg h-full overflow-hidden cursor-pointer" onClick={handleMapClick}>
                  {/* Google Maps Embed or Static Image */}
                  {mapEmbedUrl.includes('embed') ? (
                    <iframe
                      src={mapEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      onLoad={() => setMapLoaded(true)}
                      onError={() => setMapLoaded(true)}
                      title={`Map of ${video.name}`}
                    />
                  ) : (
                    <img
                      src={staticMapUrl}
                      alt={`Map of ${video.name}`}
                      className="w-full h-full object-cover"
                      onLoad={() => setMapLoaded(true)}
                      onError={() => setMapLoaded(true)}
                    />
                  )}
                  
                  {/* Loading overlay */}
                  {!mapLoaded && (
                    <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-gray-300 text-sm">Loading map...</p>
                      </div>
                    </div>
                  )}

                  {/* Click overlay */}
                  <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={handleMapClick}>
                    <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
                      Click to open in Google Maps
                    </div>
                    <div className="absolute bottom-3 right-3 bg-red-600/90 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
                      📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Information - Bottom Left (50% width, 50% height) */}
          <div className="col-span-1 row-span-1">
            <Card className="bg-gray-800/80 border-gray-700/50 h-full backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg">Key Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-6 h-full">
                  {/* Sentiment Card */}
                  <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="text-blue-400 font-bold text-lg mb-2">Neutral</div>
                    <div className="text-gray-300 text-sm text-center">Sentiment</div>
                  </div>
                  
                  {/* Threat Level Card */}
                  <div className={`${getThreatColor(incidentDetails?.threatLevel || 'Medium').replace('text-', 'bg-').replace('-500', '-600/20')} border border-red-500/30 rounded-lg p-4 flex flex-col items-center justify-center backdrop-blur-sm`}>
                    <div className={`${getThreatColor(incidentDetails?.threatLevel || 'Medium')} font-bold text-lg mb-2`}>
                      {incidentDetails?.threatLevel || 'Medium'}
                    </div>
                    <div className="text-gray-300 text-sm text-center">Threat Level</div>
                  </div>
                  
                  {/* Event Details Card */}
                  <div className="bg-gray-700/60 border border-gray-600/30 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-gray-300 text-xs mb-2">Event Details</div>
                    <div className="text-white text-sm leading-relaxed">
                      {incidentDetails?.description || 'Traffic monitoring in progress'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information - Bottom Right (50% width, 50% height) */}
          <div className="col-span-1 row-span-1">
            <Card className="bg-gray-800/80 border-gray-700/50 h-full backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 h-full overflow-y-auto p-4">
                {incidentDetails ? (
                  incidentDetails.additionalInfo.map((info, index) => (
                    <div key={index} className="bg-gray-700/60 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-white text-sm leading-relaxed">{info}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="bg-gray-700/60 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-white text-sm leading-relaxed">Traffic monitoring in progress with AI-powered object detection.</p>
                    </div>
                    <div className="bg-gray-700/60 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-white text-sm leading-relaxed">System is actively analyzing video feed for potential incidents.</p>
                    </div>
                    <div className="bg-gray-700/60 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-white text-sm leading-relaxed">Emergency services can be dispatched within 2-3 minutes if needed.</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailView;
