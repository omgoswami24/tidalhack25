import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Activity, AlertTriangle, Clock, Target } from 'lucide-react';

const StatusPanel = ({ systemStatus, detectionStats }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'detecting': return 'destructive';
      case 'offline': return 'secondary';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'detecting': return 'ACTIVE';
      case 'offline': return 'OFFLINE';
      case 'error': return 'ERROR';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className="space-y-4">
      {/* System Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Detection Status</span>
            <Badge variant={getStatusColor(systemStatus)} className="animate-pulse">
              {getStatusText(systemStatus)}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>CPU Usage</span>
              <span>45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Memory Usage</span>
              <span>2.1GB / 8GB</span>
            </div>
            <Progress value={26} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Detection Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Detection Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {detectionStats.totalDetections}
              </div>
              <div className="text-sm text-gray-500">Total Detections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {detectionStats.activeIncidents}
              </div>
              <div className="text-sm text-gray-500">Active Incidents</div>
            </div>
          </div>
          
          {detectionStats.lastDetection && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              Last Detection: {detectionStats.lastDetection.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between py-1">
              <span>Emergency Contacts</span>
              <Badge variant="outline">3 Active</Badge>
            </div>
            <div className="flex justify-between py-1">
              <span>Alert Cooldown</span>
              <span>5 minutes</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Detection Sensitivity</span>
              <span>High</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusPanel;
