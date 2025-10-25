import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { X, Play, Pause, Square, AlertTriangle, MapPin, Clock, Activity, Users, Zap } from 'lucide-react';

const VideoDetailView = ({ video, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [detections, setDetections] = useState([]);
  const [incidentDetails, setIncidentDetails] = useState(null);
  const videoRef = useRef(null);

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
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-7xl h-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Hello SafeSight, here are the details of your detection.</h2>
            <p className="text-gray-400 mt-1">{video.name} - {video.location}</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex h-full">
          {/* Left Side - Video Player */}
          <div className="flex-1 p-6">
            <Card className="bg-gray-800 border-gray-700 h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Live Detection Feed
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant={video.status === 'online' ? 'default' : 'secondary'}>
                      {video.status === 'online' ? 'LIVE' : 'OFFLINE'}
                    </Badge>
                    {video.hasIncident && (
                      <Badge variant="destructive" className="animate-pulse">
                        INCIDENT DETECTED
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-full">
                <div className="relative bg-black rounded-lg h-96 mb-4 overflow-hidden">
                  {/* Video Player Placeholder */}
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                        {isPlaying ? (
                          <Pause className="w-10 h-10 text-white" />
                        ) : (
                          <Play className="w-10 h-10 text-white" />
                        )}
                      </div>
                      <p className="text-gray-400 mb-2">Video Feed: {video.name}</p>
                      <p className="text-sm text-gray-500">Objects Detected: {video.objectsCount}</p>
                    </div>
                  </div>

                  {/* Detection Overlays */}
                  {detections.map((detection, index) => (
                    <div
                      key={detection.id}
                      className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
                      style={{
                        left: `${detection.location.x}%`,
                        top: `${detection.location.y}%`,
                        width: `${detection.location.width}%`,
                        height: `${detection.location.height}%`
                      }}
                    >
                      <div className="absolute -top-6 left-0 text-xs text-red-400 font-semibold">
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
                      className="bg-black/50 hover:bg-black/70"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <div className="flex-1 bg-gray-600 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <span className="text-white text-sm">{formatTime(currentTime)}</span>
                  </div>
                </div>

                {/* Detection Summary */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-400">{detections.length}</div>
                    <div className="text-gray-500">Total Detections</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-400">
                      {detections.filter(d => d.type === 'Vehicle').length}
                    </div>
                    <div className="text-gray-500">Vehicles</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-yellow-400">
                      {Math.round(detections.reduce((acc, d) => acc + d.confidence, 0) / detections.length * 100) || 0}%
                    </div>
                    <div className="text-gray-500">Avg Confidence</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Incident Details */}
          <div className="w-96 p-6 border-l border-gray-700">
            <div className="space-y-6">
              {/* Key Information */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Key Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sentiment:</span>
                    <span className="text-blue-400">Neutral</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Threat Level:</span>
                    <span className={getThreatColor(incidentDetails?.threatLevel || 'Medium')}>
                      {incidentDetails?.threatLevel || 'Medium'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Event Details:</span>
                    <span className="text-white text-sm">
                      {incidentDetails?.description || 'Traffic monitoring in progress'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-700 rounded-lg p-4 h-32 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-white text-sm">{video.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Detections */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Recent Detections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                  {detections.slice(0, 5).map((detection) => (
                    <div key={detection.id} className="flex items-start space-x-3 p-2 bg-gray-700 rounded">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{detection.type}</div>
                        <div className="text-gray-400 text-xs">{detection.description}</div>
                        <div className="text-gray-500 text-xs flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {detection.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Additional Information */}
              {incidentDetails && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {incidentDetails.additionalInfo.map((info, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {info}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Dismiss
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Alert Emergency Services
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailView;
