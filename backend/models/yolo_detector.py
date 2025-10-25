"""
YOLO Object Detection Module for SafeSight
Handles real-time object detection using YOLOv8
"""

import cv2
import numpy as np
from ultralytics import YOLO
import torch
from typing import List, Dict, Tuple
import time

class YOLODetector:
    def __init__(self, model_path: str = 'yolov8n.pt', device: str = 'cpu'):
        """
        Initialize YOLO detector
        
        Args:
            model_path: Path to YOLO model file
            device: Device to run inference on ('cpu' or 'cuda')
        """
        self.model_path = model_path
        self.device = device
        self.model = None
        self.class_names = {}
        self.load_model()
        
    def load_model(self):
        """Load YOLO model"""
        try:
            self.model = YOLO(self.model_path)
            self.class_names = self.model.names
            print(f"YOLO model loaded successfully on {self.device}")
            print(f"Available classes: {list(self.class_names.values())}")
        except Exception as e:
            print(f"Error loading YOLO model: {e}")
            self.model = None
    
    def detect_objects(self, frame: np.ndarray, confidence_threshold: float = 0.5) -> List[Dict]:
        """
        Detect objects in a frame
        
        Args:
            frame: Input image frame
            confidence_threshold: Minimum confidence for detections
            
        Returns:
            List of detection dictionaries
        """
        if self.model is None:
            return []
        
        try:
            # Run inference
            results = self.model(frame, verbose=False, conf=confidence_threshold)
            detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Extract box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = box.conf[0].cpu().numpy()
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = self.class_names[class_id]
                        
                        # Calculate box dimensions
                        width = int(x2 - x1)
                        height = int(y2 - y1)
                        
                        detection = {
                            'x': int(x1),
                            'y': int(y1),
                            'width': width,
                            'height': height,
                            'label': class_name,
                            'confidence': float(confidence),
                            'class_id': class_id,
                            'type': self._classify_detection(class_name, confidence)
                        }
                        
                        detections.append(detection)
            
            return detections
            
        except Exception as e:
            print(f"Error in object detection: {e}")
            return []
    
    def _classify_detection(self, class_name: str, confidence: float) -> str:
        """
        Classify detection type based on class name and confidence
        
        Args:
            class_name: Name of detected class
            confidence: Detection confidence
            
        Returns:
            Detection type ('vehicle', 'person', 'incident', 'normal')
        """
        # Vehicle-related classes
        vehicle_classes = ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'train']
        
        # Person-related classes
        person_classes = ['person']
        
        # Potential incident indicators
        incident_classes = ['fire', 'smoke']
        
        if class_name in vehicle_classes:
            return 'vehicle'
        elif class_name in person_classes:
            return 'person'
        elif class_name in incident_classes:
            return 'incident'
        else:
            return 'normal'
    
    def detect_traffic_incidents(self, frame: np.ndarray) -> Dict:
        """
        Detect potential traffic incidents
        
        Args:
            frame: Input image frame
            
        Returns:
            Dictionary with incident detection results
        """
        detections = self.detect_objects(frame)
        
        # Analyze detections for incident patterns
        vehicles = [d for d in detections if d['type'] == 'vehicle']
        persons = [d for d in detections if d['type'] == 'person']
        incidents = [d for d in detections if d['type'] == 'incident']
        
        # Check for potential incidents
        has_incident = False
        incident_type = 'none'
        severity = 'low'
        
        # Check for fire/smoke
        if incidents:
            has_incident = True
            incident_type = 'fire'
            severity = 'high'
        
        # Check for vehicle collisions (simplified heuristic)
        if len(vehicles) >= 2:
            # Check if vehicles are too close (simplified)
            for i, v1 in enumerate(vehicles):
                for v2 in vehicles[i+1:]:
                    distance = self._calculate_distance(v1, v2)
                    if distance < 50:  # Threshold for collision detection
                        has_incident = True
                        incident_type = 'collision'
                        severity = 'high'
                        break
        
        # Check for person in road
        if persons and vehicles:
            for person in persons:
                for vehicle in vehicles:
                    if self._calculate_distance(person, vehicle) < 100:
                        has_incident = True
                        incident_type = 'pedestrian_danger'
                        severity = 'high'
                        break
        
        return {
            'has_incident': has_incident,
            'incident_type': incident_type,
            'severity': severity,
            'detections': detections,
            'vehicle_count': len(vehicles),
            'person_count': len(persons),
            'incident_count': len(incidents)
        }
    
    def _calculate_distance(self, obj1: Dict, obj2: Dict) -> float:
        """
        Calculate distance between two objects
        
        Args:
            obj1: First object detection
            obj2: Second object detection
            
        Returns:
            Distance between object centers
        """
        center1_x = obj1['x'] + obj1['width'] // 2
        center1_y = obj1['y'] + obj1['height'] // 2
        center2_x = obj2['x'] + obj2['width'] // 2
        center2_y = obj2['y'] + obj2['height'] // 2
        
        distance = np.sqrt((center1_x - center2_x)**2 + (center1_y - center2_y)**2)
        return distance
    
    def draw_detections(self, frame: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """
        Draw detection boxes on frame
        
        Args:
            frame: Input image frame
            detections: List of detections to draw
            
        Returns:
            Frame with drawn detections
        """
        frame_copy = frame.copy()
        
        for detection in detections:
            x, y, w, h = detection['x'], detection['y'], detection['width'], detection['height']
            label = detection['label']
            confidence = detection['confidence']
            detection_type = detection['type']
            
            # Choose color based on detection type
            if detection_type == 'incident':
                color = (0, 0, 255)  # Red for incidents
            elif detection_type == 'vehicle':
                color = (0, 255, 0)  # Green for vehicles
            elif detection_type == 'person':
                color = (255, 0, 0)  # Blue for persons
            else:
                color = (128, 128, 128)  # Gray for others
            
            # Draw bounding box
            cv2.rectangle(frame_copy, (x, y), (x + w, y + h), color, 2)
            
            # Draw label and confidence
            label_text = f"{label}: {confidence:.2f}"
            label_size = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            
            # Draw label background
            cv2.rectangle(frame_copy, (x, y - label_size[1] - 10), 
                         (x + label_size[0], y), color, -1)
            
            # Draw label text
            cv2.putText(frame_copy, label_text, (x, y - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        return frame_copy
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        if self.model is None:
            return {'loaded': False}
        
        return {
            'loaded': True,
            'model_path': self.model_path,
            'device': self.device,
            'classes': list(self.class_names.values()),
            'num_classes': len(self.class_names)
        }
