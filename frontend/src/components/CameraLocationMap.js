import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

const CameraLocationMap = ({ camera, onClose }) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  const location = camera.coordinates
    ? { lat: camera.coordinates.lat, lng: camera.coordinates.lng, address: camera.location }
    : { lat: 30.2672, lng: -97.7431, address: camera.location };

  // Keyless Google Maps embed - works without an API key
  const mapEmbedUrl = `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`;
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;

  const handleMapClick = () => {
    window.open(searchUrl, '_blank');
  };

  const handleNavigationClick = () => {
    window.open(navigationUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-zinc-950 border-white/[0.08] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-red-500" />
              <div>
                <CardTitle className="text-white text-xl">{camera.name}</CardTitle>
                <p className="text-zinc-500 text-sm">{location.address}</p>
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
                className="text-zinc-500 hover:text-white hover:bg-white/[0.06]"
              >
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative">
            {/* Google Maps Embed (keyless) */}
            <div className="relative w-full h-96 bg-zinc-900">
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
                title={`Map of ${camera.name}`}
              />

              {/* Loading overlay */}
              {!mapLoaded && (
                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-zinc-500">Loading map...</p>
                  </div>
                </div>
              )}

              {/* Coordinates chip */}
              <div className="absolute bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm pointer-events-none">
                📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-4 bg-zinc-950 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-zinc-400">
                    <span className="font-medium">Coordinates:</span> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                  <div className="text-sm text-zinc-400">
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
                    className="bg-white text-black border-gray-300 hover:bg-zinc-200 hover:text-black"
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
