"""
Advanced Car Crash Detection System
Uses computer vision and AI to detect car crashes in video feeds
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
import time
import json
from datetime import datetime

class CrashDetector:
    def __init__(self):
        """Initialize the crash detection system"""
        self.detection_history = []
        self.crash_threshold = 0.7
        self.motion_threshold = 50
        self.velocity_threshold = 30
        
    def detect_crash_in_frame(self, frame: np.ndarray, previous_frame: Optional[np.ndarray] = None) -> Dict:
        """
        Detect potential car crash in a single frame
        
        Args:
            frame: Current video frame
            previous_frame: Previous frame for motion analysis
            
        Returns:
            Dictionary with detection results
        """
        if frame is None:
            return self._get_no_detection_result()
        
        # Convert to grayscale for processing
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Initialize result
        result = {
            'has_crash': False,
            'confidence': 0.0,
            'crash_type': 'none',
            'objects_detected': 0,
            'motion_detected': False,
            'anomaly_score': 0.0,
            'bounding_boxes': [],
            'description': 'No crash detected'
        }
        
        # 1. Detect vehicles using simple contour detection
        vehicles = self._detect_vehicles(gray)
        result['objects_detected'] = len(vehicles)
        
        if len(vehicles) == 0:
            return result
        
        # 2. Analyze motion if previous frame available
        if previous_frame is not None:
            motion_data = self._analyze_motion(gray, cv2.cvtColor(previous_frame, cv2.COLOR_BGR2GRAY))
            result['motion_detected'] = motion_data['has_motion']
            result['anomaly_score'] = motion_data['anomaly_score']
        
        # 3. Detect potential crash patterns
        crash_indicators = self._detect_crash_indicators(frame, vehicles)
        
        # 4. Calculate overall crash probability
        crash_probability = self._calculate_crash_probability(
            vehicles, 
            crash_indicators, 
            result['anomaly_score']
        )
        
        if crash_probability > self.crash_threshold:
            result['has_crash'] = True
            result['confidence'] = crash_probability
            result['crash_type'] = crash_indicators['crash_type']
            result['description'] = crash_indicators['description']
            result['bounding_boxes'] = crash_indicators['bounding_boxes']
        
        return result
    
    def _detect_vehicles(self, gray_frame: np.ndarray) -> List[Dict]:
        """Detect vehicles in the frame using contour analysis"""
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray_frame, (5, 5), 0)
        
        # Edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        vehicles = []
        for contour in contours:
            area = cv2.contourArea(contour)
            # Filter by area (vehicles should be reasonably sized)
            if 1000 < area < 50000:
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / h
                # Vehicles typically have aspect ratios between 1.5 and 4
                if 1.2 < aspect_ratio < 5.0:
                    vehicles.append({
                        'contour': contour,
                        'bbox': (x, y, w, h),
                        'area': area,
                        'aspect_ratio': aspect_ratio
                    })
        
        return vehicles
    
    def _analyze_motion(self, current_gray: np.ndarray, previous_gray: np.ndarray) -> Dict:
        """Analyze motion between frames"""
        # Calculate frame difference
        diff = cv2.absdiff(current_gray, previous_gray)
        
        # Apply threshold
        _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
        
        # Calculate motion metrics
        motion_pixels = np.sum(thresh > 0)
        total_pixels = thresh.shape[0] * thresh.shape[1]
        motion_ratio = motion_pixels / total_pixels
        
        # Calculate anomaly score based on motion patterns
        anomaly_score = min(motion_ratio * 10, 1.0)
        
        return {
            'has_motion': motion_ratio > 0.01,
            'motion_ratio': motion_ratio,
            'anomaly_score': anomaly_score
        }
    
    def _detect_crash_indicators(self, frame: np.ndarray, vehicles: List[Dict]) -> Dict:
        """Detect specific indicators of car crashes"""
        indicators = {
            'crash_type': 'none',
            'description': 'No crash indicators detected',
            'bounding_boxes': [],
            'confidence': 0.0
        }
        
        if len(vehicles) < 2:
            return indicators
        
        # Check for vehicle proximity (potential collision)
        collision_risk = self._check_vehicle_proximity(vehicles)
        
        # Check for unusual vehicle orientations
        orientation_anomaly = self._check_orientation_anomalies(vehicles)
        
        # Check for debris patterns
        debris_detected = self._detect_debris_patterns(frame)
        
        # Calculate overall crash indicators
        crash_score = (collision_risk + orientation_anomaly + debris_detected) / 3
        
        if crash_score > 0.6:
            indicators['confidence'] = crash_score
            indicators['crash_type'] = 'collision'
            indicators['description'] = f'Vehicle collision detected (confidence: {crash_score:.2f})'
            indicators['bounding_boxes'] = [v['bbox'] for v in vehicles]
        
        return indicators
    
    def _check_vehicle_proximity(self, vehicles: List[Dict]) -> float:
        """Check if vehicles are too close to each other"""
        if len(vehicles) < 2:
            return 0.0
        
        min_distance = float('inf')
        for i, v1 in enumerate(vehicles):
            for v2 in vehicles[i+1:]:
                x1, y1, w1, h1 = v1['bbox']
                x2, y2, w2, h2 = v2['bbox']
                
                # Calculate center points
                center1 = (x1 + w1//2, y1 + h1//2)
                center2 = (x2 + w2//2, y2 + h2//2)
                
                # Calculate distance
                distance = np.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)
                min_distance = min(min_distance, distance)
        
        # Normalize distance (closer = higher risk)
        proximity_risk = max(0, 1 - (min_distance / 200))
        return proximity_risk
    
    def _check_orientation_anomalies(self, vehicles: List[Dict]) -> float:
        """Check for unusual vehicle orientations that might indicate crashes"""
        anomaly_score = 0.0
        
        for vehicle in vehicles:
            # Check aspect ratio anomalies
            aspect_ratio = vehicle['aspect_ratio']
            if aspect_ratio < 0.8 or aspect_ratio > 6.0:  # Very unusual for vehicles
                anomaly_score += 0.3
            
            # Check for very small or very large vehicles
            area = vehicle['area']
            if area < 2000 or area > 40000:
                anomaly_score += 0.2
        
        return min(anomaly_score, 1.0)
    
    def _detect_debris_patterns(self, frame: np.ndarray) -> float:
        """Detect debris patterns that might indicate a crash"""
        # Convert to HSV for better color detection
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Look for bright/reflective debris (glass, metal)
        bright_mask = cv2.inRange(hsv, np.array([0, 0, 200]), np.array([180, 30, 255]))
        
        # Look for dark debris (rubber, plastic)
        dark_mask = cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 255, 50]))
        
        # Combine masks
        debris_mask = cv2.bitwise_or(bright_mask, dark_mask)
        
        # Calculate debris ratio
        debris_pixels = np.sum(debris_mask > 0)
        total_pixels = debris_mask.shape[0] * debris_mask.shape[1]
        debris_ratio = debris_pixels / total_pixels
        
        # Normalize to 0-1 scale
        debris_score = min(debris_ratio * 20, 1.0)
        
        return debris_score
    
    def _calculate_crash_probability(self, vehicles: List[Dict], indicators: Dict, anomaly_score: float) -> float:
        """Calculate overall crash probability"""
        if len(vehicles) == 0:
            return 0.0
        
        # Base probability from indicators
        base_prob = indicators['confidence']
        
        # Boost probability based on anomaly score
        anomaly_boost = anomaly_score * 0.3
        
        # Boost probability if multiple vehicles detected
        vehicle_boost = min(len(vehicles) * 0.1, 0.3)
        
        # Calculate final probability
        final_prob = base_prob + anomaly_boost + vehicle_boost
        
        return min(final_prob, 1.0)
    
    def _get_no_detection_result(self) -> Dict:
        """Return default no-detection result"""
        return {
            'has_crash': False,
            'confidence': 0.0,
            'crash_type': 'none',
            'objects_detected': 0,
            'motion_detected': False,
            'anomaly_score': 0.0,
            'bounding_boxes': [],
            'description': 'No crash detected'
        }
    
    def process_video_file(self, video_path: str) -> List[Dict]:
        """Process an entire video file for crash detection"""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return []
        
        results = []
        frame_count = 0
        previous_frame = None
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process every 10th frame for efficiency
            if frame_count % 10 == 0:
                result = self.detect_crash_in_frame(frame, previous_frame)
                result['frame_number'] = frame_count
                result['timestamp'] = frame_count / cap.get(cv2.CAP_PROP_FPS)
                results.append(result)
                
                if result['has_crash']:
                    print(f"Crash detected at frame {frame_count}, confidence: {result['confidence']:.2f}")
            
            previous_frame = frame.copy()
            frame_count += 1
        
        cap.release()
        return results
    
    def get_detection_summary(self, results: List[Dict]) -> Dict:
        """Get summary of detection results"""
        total_frames = len(results)
        crash_frames = [r for r in results if r['has_crash']]
        
        return {
            'total_frames_analyzed': total_frames,
            'crash_frames_detected': len(crash_frames),
            'crash_probability': len(crash_frames) / total_frames if total_frames > 0 else 0,
            'max_confidence': max([r['confidence'] for r in crash_frames]) if crash_frames else 0,
            'crash_types': list(set([r['crash_type'] for r in crash_frames if r['crash_type'] != 'none']))
        }
