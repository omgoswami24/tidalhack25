import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '../config/maps';

const CameraLocationMap = ({ camera, onClose }) => {
  const [mapLoaded, setMapLoaded] = useState(false);

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
    }
  };

  const location = cameraLocations[camera.name] || {
    lat: 37.7749,
    lng: -122.4194,
    address: camera.location
  };

  // Generate Google Maps embed URL
  const mapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${location.lat},${location.lng}&zoom=15&maptype=roadmap`;

  // Generate Google Maps navigation URL
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;

  // Generate Google Maps search URL
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;

  const handleMapClick = () => {
    window.open(searchUrl, '_blank');
  };

  const handleNavigationClick = () => {
    window.open(navigationUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gray-800 border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-red-500" />
              <div>
                <CardTitle className="text-white text-xl">{camera.name}</CardTitle>
                <p className="text-gray-400 text-sm">{location.address}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {camera.hasIncident && (
                <Badge variant="destructive" className="animate-pulse">
                  {camera.incidentType?.toUpperCase() || 'INCIDENT'}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative">
            {/* Google Maps Embed */}
            <div className="relative w-full h-96 bg-gray-700">
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setMapLoaded(true)}
                onError={() => setMapLoaded(true)} // Fallback if map fails to load
                className="cursor-pointer"
                onClick={handleMapClick}
                title={`Map of ${camera.name}`}
              />
              
              {/* Loading overlay */}
              {!mapLoaded && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-400">Loading map...</p>
                  </div>
                </div>
              )}

              {/* Click overlay */}
              <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={handleMapClick}>
                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
                  Click to open in Google Maps
                </div>
                <div className="absolute bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm">
                  📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-300">
                    <span className="font-medium">Coordinates:</span> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                  <div className="text-sm text-gray-300">
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-1 ${camera.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                      {camera.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMapClick}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Maps
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleNavigationClick}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraLocationMap;
