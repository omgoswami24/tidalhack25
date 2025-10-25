import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Play, Pause, Square, Camera, AlertTriangle } from 'lucide-react';

const VideoPlayer = ({ isDetecting, isRecording, onIncidentDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detections, setDetections] = useState([]);
  const [stream, setStream] = useState(null);

  // Mock detection data for demonstration
  const mockDetections = [
    { id: 1, x: 100, y: 150, width: 200, height: 100, label: 'Vehicle', confidence: 0.95, type: 'normal' },
    { id: 2, x: 300, y: 200, width: 180, height: 90, label: 'Vehicle', confidence: 0.87, type: 'normal' },
    { id: 3, x: 150, y: 300, width: 120, height: 80, label: 'Person', confidence: 0.92, type: 'normal' }
  ];

  useEffect(() => {
    if (isDetecting) {
      startDetection();
    } else {
      stopDetection();
    }
  }, [isDetecting]);

  const startDetection = async () => {
    try {
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsPlaying(true);
        setStream(mediaStream);
      }

      // Start mock detection simulation
      simulateDetections();
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to mock video for demo
      startMockVideo();
    }
  };

  const startMockVideo = () => {
    // Use a placeholder video or create a canvas with mock content
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = 1280;
      canvas.height = 720;
      
      // Draw a simple mock video background
      const drawFrame = () => {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw road
        ctx.fillStyle = '#374151';
        ctx.fillRect(0, canvas.height - 200, canvas.width, 200);
        
        // Draw lane lines
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height - 200);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        
        // Draw some mock vehicles
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(200, canvas.height - 250, 100, 50);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(400, canvas.height - 280, 120, 60);
        
        if (isDetecting) {
          requestAnimationFrame(drawFrame);
        }
      };
      
      drawFrame();
      setIsPlaying(true);
    }
  };

  const stopDetection = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setIsPlaying(false);
    setDetections([]);
  };

  const simulateDetections = () => {
    if (!isDetecting) return;

    const interval = setInterval(() => {
      // Simulate random detections
      const newDetections = mockDetections.map(detection => ({
        ...detection,
        x: detection.x + (Math.random() - 0.5) * 20,
        y: detection.y + (Math.random() - 0.5) * 10,
        confidence: Math.random() * 0.3 + 0.7
      }));

      setDetections(newDetections);

      // Simulate incident detection (5% chance)
      if (Math.random() < 0.05) {
        const incident = {
          id: Date.now(),
          timestamp: new Date(),
          type: 'Vehicle Collision',
          severity: 'high',
          location: 'Highway 101, Mile 45.2',
          description: 'Two vehicles collided with visible damage and debris',
          confidence: 0.95
        };
        onIncidentDetected(incident);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const drawDetections = () => {
    const canvas = canvasRef.current;
    if (!canvas || !isDetecting) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Clear previous detections
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw detection boxes
    detections.forEach(detection => {
      const x = detection.x * scaleX;
      const y = detection.y * scaleY;
      const width = detection.width * scaleX;
      const height = detection.height * scaleY;

      // Draw bounding box
      ctx.strokeStyle = detection.type === 'incident' ? '#ef4444' : '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw label
      ctx.fillStyle = detection.type === 'incident' ? '#ef4444' : '#10b981';
      ctx.font = '14px Arial';
      ctx.fillText(
        `${detection.label} (${Math.round(detection.confidence * 100)}%)`,
        x,
        y - 5
      );
    });
  };

  useEffect(() => {
    drawDetections();
  }, [detections, isDetecting]);

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-auto max-h-96 object-cover"
          playsInline
          muted
        />
        
        {/* Canvas Overlay for Detections */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ display: videoRef.current ? 'none' : 'block' }}
        />

        {/* Detection Status Overlay */}
        {isDetecting && (
          <div className="absolute top-4 left-4 flex space-x-2">
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              DETECTING
            </Badge>
            {isRecording && (
              <Badge variant="secondary" className="animate-pulse">
                <Camera className="w-3 h-3 mr-1" />
                RECORDING
              </Badge>
            )}
          </div>
        )}

        {/* Video Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-black/50 hover:bg-black/70"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={stopDetection}
            className="bg-black/50 hover:bg-black/70"
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Detection Stats */}
      {isDetecting && (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{detections.length}</div>
            <div className="text-gray-500">Objects Detected</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">
              {detections.filter(d => d.type === 'incident').length}
            </div>
            <div className="text-gray-500">Incidents</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-yellow-600">
              {Math.round(detections.reduce((acc, d) => acc + d.confidence, 0) / detections.length * 100) || 0}%
            </div>
            <div className="text-gray-500">Avg Confidence</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
