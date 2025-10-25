import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Play, Pause, MapPin, Activity } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { GOOGLE_MAPS_API_KEY } from '../config/maps';

const VideoDetailView = ({ video, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();
  const [incidentDetails, setIncidentDetails] = useState(null);
  const videoRef = useRef(null);
  const mapRef = useRef(null);

  // Randomize locations for each camera
  const getRandomLocation = (cameraName) => {
    const locations = [
      { lat: 37.7749, lng: -122.4194, address: 'Highway 101, Mile 45.2, San Francisco, CA' },
      { lat: 37.3382, lng: -121.8863, address: 'I-280, Exit 12, San Jose, CA' },
      { lat: 37.8044, lng: -122.2712, address: 'Highway 880, Oakland, CA' },
      { lat: 38.5816, lng: -121.4944, address: 'Highway 5, Sacramento, CA' },
      { lat: 37.4419, lng: -122.1430, address: 'Highway 101, Palo Alto, CA' },
      { lat: 37.8715, lng: -122.2730, address: 'I-80, Berkeley, CA' },
      { lat: 36.9741, lng: -122.0308, address: 'Highway 17, Santa Cruz, CA' },
      { lat: 37.6819, lng: -121.7680, address: 'I-580, Livermore, CA' },
      { lat: 37.4636, lng: -122.4285, address: 'Highway 92, Half Moon Bay, CA' },
      { lat: 37.7849, lng: -122.4094, address: 'Highway 101, Mile 46.2, San Francisco, CA' },
      { lat: 37.3482, lng: -121.8963, address: 'I-280, Exit 13, San Jose, CA' },
      { lat: 37.8144, lng: -122.2812, address: 'Highway 880, Oakland, CA' },
      { lat: 38.5916, lng: -121.5044, address: 'Highway 5, Sacramento, CA' },
      { lat: 37.4519, lng: -122.1530, address: 'Highway 101, Palo Alto, CA' },
      { lat: 37.8815, lng: -122.2830, address: 'I-80, Berkeley, CA' }
    ];
    
    // Use camera name to get consistent location for same camera
    const hash = cameraName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return locations[Math.abs(hash) % locations.length];
  };

  // Get location data for current video - use randomized location
  const location = getRandomLocation(video.name);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return;

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Create a callback function
      window.initMap = () => {
        if (mapRef.current && location) {
          const map = new window.google.maps.Map(mapRef.current, {
            zoom: 14,
            center: { lat: location.lat, lng: location.lng },
            mapTypeId: 'roadmap',
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          // Add marker
          new window.google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            animation: window.google.maps.Animation.DROP,
            title: location.address
          });
        }
      };
      
      document.head.appendChild(script);
    } else {
      // Map already loaded, create map directly
      if (mapRef.current && location && window.google.maps) {
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 14,
          center: { lat: location.lat, lng: location.lng },
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: map,
          animation: window.google.maps.Animation.DROP,
          title: location.address
        });
      }
    }

    return () => {
      if (window.initMap) {
        delete window.initMap;
      }
    };
  }, [location]);

  // Handle map click to open in Google Maps
  const handleMapClick = () => {
    console.log('🗺️ Map clicked! Opening Google Maps...');
    console.log('📍 Location:', location);
    const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    console.log('🔗 Maps URL:', mapsUrl);
    window.open(mapsUrl, '_blank');
  };

  // Handle security alert
  const handleSecurityAlert = async () => {
    try {
      const alertData = {
        type: incidentDetails?.type || 'Traffic Incident',
        location: video.location,
        severity: incidentDetails?.severity || 'High',
        description: incidentDetails?.description || `Incident detected on ${video.name}`,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('http://localhost:5001/api/security-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "📞 Emergency Call Initiated!",
          description: `Calling ${result.to_number} - Status: ${result.status}`,
          variant: "default",
        });
      } else {
        toast({
          title: "❌ Call Failed",
          description: result.error || "Failed to initiate emergency call",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending security alert:', error);
      toast({
        title: "❌ Error",
        description: "Failed to initiate emergency call. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Initialize incident details
  useEffect(() => {
    // Generate incident details based on video
    const generateIncidentDetails = (video) => {
      return {
        type: video.incidentType || 'collision',
        severity: 'Critical',
        threatLevel: 'High', // Always set to High
        description: video.incidentType 
          ? `Traffic collision detected on ${video.name}. Multiple vehicles involved. Emergency services have been notified.`
          : 'Traffic monitoring in progress. No incidents detected.',
        timestamp: new Date().toISOString(),
        location: video.location,
        confidence: video.confidence || 0.95
      };
    };

    setIncidentDetails(generateIncidentDetails(video));
  }, [video]);

  // Video controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
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
      default: return 'text-gray-500';
    }
  };

  if (!video) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-7xl h-[95vh] flex flex-col shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Hello Oculon, here are the details of your detection.</h2>
            <p className="text-gray-200 mt-1 font-medium">{video.name} - {video.location}</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Live Camera Feed */}
              <div className="xl:col-span-1">
                <Card className="bg-gray-800/80 border-gray-700/50 backdrop-blur-sm">
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
                  <CardContent className="p-0">
                    <div className="relative bg-black rounded-lg h-80 overflow-hidden">
                      <video
                        ref={videoRef}
                        src={`/Videos/${video.filename}`}
                        className="w-full h-full object-cover"
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                      
                      {/* Video Controls Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={togglePlayPause}
                              size="sm"
                              variant="ghost"
                              className="text-white hover:bg-white/20"
                            >
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <span className="text-white text-sm font-mono">
                              {formatTime(currentTime)}
                            </span>
                          </div>
                          <div className="text-white text-sm">
                            {video.filename}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Map Section */}
              <div className="xl:col-span-1">
                <Card className="bg-gray-800/80 border-gray-700/50 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-xl flex items-center">
                      <MapPin className="w-6 h-6 mr-3" />
                      Location Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="relative h-80 rounded-lg overflow-hidden bg-gray-700">
                      {/* Google Maps container */}
                      <div 
                        ref={mapRef}
                        className="w-full h-full cursor-pointer"
                        title="Click to open in Google Maps"
                        onClick={handleMapClick}
                      >
                        {/* Fallback if Google Maps doesn't load */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center">
                          <div className="text-center">
                            <MapPin className="w-12 h-12 mx-auto mb-2 text-white animate-pulse" />
                            <p className="text-white font-semibold">Loading map...</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Location info overlay */}
                      <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm pointer-events-none">
                        <div className="font-semibold">Camera Location</div>
                        <div className="text-xs text-gray-300">{location.address}</div>
                      </div>
                      
                      {/* Coordinates */}
                      <div className="absolute bottom-3 right-3 bg-red-600/90 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm pointer-events-none">
                        📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </div>
                      
                      {/* Click instruction */}
                      <div className="absolute top-3 right-3 bg-black/80 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm cursor-pointer hover:bg-black/90 transition-colors pointer-events-auto">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Click to open in Google Maps
                        </div>
                      </div>
                    </div>
                    
                    {/* Map action button */}
                    <div className="mt-4 flex justify-center">
                      <Button 
                        onClick={handleMapClick}
                        variant="outline"
                        className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:border-blue-400/50"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Open in Google Maps
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Key Information - Now in scrollable area */}
            <div className="flex justify-center mt-6 pb-6">
              <Card className="bg-gray-800/80 border-gray-700/50 w-full max-w-4xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-lg text-center">Key Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sentiment Card */}
                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 flex flex-col items-center justify-center backdrop-blur-sm">
                      <div className="text-blue-400 font-bold text-lg mb-2">Neutral</div>
                      <div className="text-gray-300 text-sm text-center">Sentiment</div>
                    </div>
                    
                    {/* Threat Level Card */}
                    <div className={`${getThreatColor(incidentDetails?.threatLevel || 'High').replace('text-', 'bg-').replace('-500', '-600/20')} border border-red-500/30 rounded-lg p-4 flex flex-col items-center justify-center backdrop-blur-sm`}>
                      <div className={`${getThreatColor(incidentDetails?.threatLevel || 'High')} font-bold text-lg mb-2`}>
                        {incidentDetails?.threatLevel || 'High'}
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
                  
                  {/* Emergency Call Button */}
                  {incidentDetails?.type && incidentDetails.type !== 'normal' && (
                    <div className="mt-6 flex justify-center">
                      <Button 
                        onClick={handleSecurityAlert}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold"
                      >
                        📞 Call Emergency Services
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailView;