import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import SurveillanceGrid from '../components/SurveillanceGrid';
import IncidentFeed from '../components/IncidentFeed';
import StatusPanel from '../components/StatusPanel';
import VideoDetailView from '../components/VideoDetailView';
import { AlertTriangle, Camera, Settings, Upload, BarChart3 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Dashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [systemStatus, setSystemStatus] = useState('offline');
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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SafeSight</h1>
              <p className="text-sm text-gray-400">AI-Powered Traffic Incident Detection</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge 
              variant={systemStatus === 'detecting' ? 'destructive' : 'secondary'}
              className="animate-pulse"
            >
              {systemStatus === 'detecting' ? 'DETECTING' : 'OFFLINE'}
            </Badge>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
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
            <IncidentFeed incidents={incidents} />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{incidents.length}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{detectionStats.activeIncidents}</div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.5%</div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.3s</div>
                  <p className="text-xs text-muted-foreground">Average</p>
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
