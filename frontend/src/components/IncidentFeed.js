import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, Clock, MapPin, Eye } from 'lucide-react';

const IncidentFeed = ({ incidents, onViewCamera }) => {
  const getSeverityColor = (severity) => {
    if (!severity) return 'secondary';
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'secondary';
    switch (status) {
      case 'alerted': return 'destructive';
      case 'monitoring': return 'default';
      case 'resolved': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/80 border-gray-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Incident History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="text-white">No incidents detected yet</p>
              <p className="text-sm text-gray-400">Start detection to monitor for traffic incidents</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <Card key={incident.id} className="hover:shadow-md transition-shadow bg-gray-700/50 border-gray-600/50 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg text-white">{incident.type || 'Unknown Incident'}</h3>
                          <Badge variant={getSeverityColor(incident.severity)}>
                            {(incident.severity || 'unknown').toUpperCase()}
                          </Badge>
                          <Badge variant={getStatusColor(incident.status)}>
                            {(incident.status || 'unknown').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-300 mb-3">{incident.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {incident.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatTimeAgo(incident.timestamp)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        {incident.image && (
                          <img
                            src={incident.image}
                            alt="Incident"
                            className="w-24 h-16 object-cover rounded border"
                          />
                        )}
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onViewCamera?.(incident.videoId)}
                            title="View Camera"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentFeed;
