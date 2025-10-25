import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import SurveillanceGrid from '../components/SurveillanceGrid';
import IncidentFeed from '../components/IncidentFeed';
import VideoDetailView from '../components/VideoDetailView';
import { AlertTriangle, Camera, BarChart3 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Dashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [detectionStats, setDetectionStats] = useState({
    totalDetections: 0,
    activeIncidents: 0,
    lastDetection: null
  });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoDetail, setShowVideoDetail] = useState(false);
  const { toast } = useToast();

  // Handle incident detection from surveillance grid
  const handleIncidentDetected = (incident) => {
    setIncidents(prev => [incident, ...prev]);
    setDetectionStats(prev => ({
      ...prev,
      totalDetections: prev.totalDetections + 1,
      activeIncidents: prev.activeIncidents + 1,
      lastDetection: new Date()
    }));
    
    toast({
      title: "🚨 Traffic Incident Detected",
      description: `${incident.type} detected on ${incident.location}. Emergency services have been notified.`,
      duration: 6000,
      className: "bg-red-600/90 text-white border-red-500 backdrop-blur-sm",
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

  // Handle viewing camera from incident
  const handleViewCamera = async (videoId) => {
    try {
      // Fetch video data by ID
      const response = await fetch(`http://localhost:5001/api/videos/${videoId}`);
      if (response.ok) {
        const video = await response.json();
        setSelectedVideo(video);
        setShowVideoDetail(true);
      } else {
        toast({
          title: "Error",
          description: "Could not find camera video",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      toast({
        title: "Error",
        description: "Failed to load camera video",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/image.png" alt="Oculon Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Oculon</h1>
              <p className="text-sm text-gray-400">AI-Powered Traffic Incident Detection</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs defaultValue="surveillance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="surveillance" className="data-[state=active]:bg-gray-700">
              <Camera className="w-4 h-4 mr-2" />
              Surveillance
            </TabsTrigger>
            <TabsTrigger value="incidents" className="data-[state=active]:bg-gray-700">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Incidents
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="surveillance" className="space-y-6">
            <SurveillanceGrid onIncidentDetected={handleIncidentDetected} onVideoClick={handleVideoClick} />
          </TabsContent>

          <TabsContent value="incidents">
            <IncidentFeed incidents={incidents} onViewCamera={handleViewCamera} />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-gray-800/80 border-gray-700/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                    Total Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-white mb-2">{incidents.length}</div>
                  <p className="text-sm text-gray-400">All time detections</p>
                  <div className="mt-4 bg-gray-700/50 rounded-lg p-3">
                    <div className="text-xs text-gray-300 mb-1">Detection Trend</div>
                    <div className="text-sm text-green-400">↗ +12% from last week</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/80 border-gray-700/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-white flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                    Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-red-400 mb-2">{detectionStats.activeIncidents}</div>
                  <p className="text-sm text-gray-400">Currently requiring attention</p>
                  <div className="mt-4 bg-red-600/20 border border-red-500/30 rounded-lg p-3">
                    <div className="text-xs text-red-300 mb-1">Status</div>
                    <div className="text-sm text-red-400">🚨 Emergency Response Active</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/80 border-gray-700/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-white flex items-center">
                    <Camera className="w-5 h-5 mr-2 text-green-400" />
                    Detection Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-green-400 mb-2">98.5%</div>
                  <p className="text-sm text-gray-400">AI accuracy rate</p>
                  <div className="mt-4 bg-gray-700/50 rounded-lg p-3">
                    <div className="text-xs text-gray-300 mb-1">Performance</div>
                    <div className="text-sm text-green-400">✓ Excellent</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/80 border-gray-700/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-white flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                    Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-yellow-400 mb-2">2.3s</div>
                  <p className="text-sm text-gray-400">Average detection time</p>
                  <div className="mt-4 bg-gray-700/50 rounded-lg p-3">
                    <div className="text-xs text-gray-300 mb-1">Speed</div>
                    <div className="text-sm text-yellow-400">⚡ Fast Response</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Video Detail Modal */}
      {showVideoDetail && selectedVideo && (
        <VideoDetailView 
          video={selectedVideo} 
          onClose={closeVideoDetail} 
        />
      )}
    </div>
  );
};

export default Dashboard;
