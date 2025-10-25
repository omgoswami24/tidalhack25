"""
Real-Time Crash Detection System
Uses computer vision + Gemini VLM for accurate, realistic detection
"""

import cv2
import numpy as np
import time
import json
import base64
import google.generativeai as genai
from typing import Dict, List, Optional
import os

class RealTimeDetector:
    def __init__(self):
        self.gemini_model = None
        self.detection_history = {}
        self.frame_buffers = {}  # Store recent frames for analysis
        self.last_detection_time = {}
        
        # Initialize Gemini VLM
        try:
            api_key = os.getenv('GEMINI_API_KEY')
            if api_key:
                genai.configure(api_key=api_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
                print("✅ Real-time Gemini VLM initialized")
            else:
                print("⚠️  GEMINI_API_KEY not found")
        except Exception as e:
            print(f"⚠️  Gemini VLM not available: {e}")
    
    def analyze_video_frame(self, video_id: str, frame: np.ndarray, frame_number: int) -> Dict:
        """
        Analyze a single frame for crash detection
        Returns detection result with confidence and details
        """
        if frame is None:
            return self._get_no_detection_result()
        
        # Store frame in buffer for motion analysis
        if video_id not in self.frame_buffers:
            self.frame_buffers[video_id] = []
        
        self.frame_buffers[video_id].append(frame.copy())
        if len(self.frame_buffers[video_id]) > 5:  # Keep last 5 frames
            self.frame_buffers[video_id].pop(0)
        
        # Only analyze every 30th frame to reduce API calls and make it realistic
        if frame_number % 30 != 0:
            return self._get_no_detection_result()
        
        # Check if we recently detected a crash (avoid spam)
        if video_id in self.last_detection_time:
            if time.time() - self.last_detection_time[video_id] < 10:  # 10 second cooldown
                return self._get_no_detection_result()
        
        # Use computer vision first for quick filtering
        cv_result = self._analyze_with_computer_vision(frame, video_id)
        
        # Only use Gemini for high-confidence CV detections
        if cv_result['confidence'] > 0.6:
            if self.gemini_model:
                gemini_result = self._analyze_with_gemini(frame)
                if gemini_result['has_crash'] and gemini_result['confidence'] > 0.4:
                    self.last_detection_time[video_id] = time.time()
                    return {
                        'has_crash': True,
                        'confidence': gemini_result['confidence'],
                        'crash_type': gemini_result.get('crash_type', 'collision'),
                        'description': gemini_result.get('description', 'Crash detected'),
                        'severity': gemini_result.get('severity', 'high'),
                        'method': 'gemini_vlm',
                        'frame_number': frame_number
                    }
        
        return self._get_no_detection_result()
    
    def _analyze_with_computer_vision(self, frame: np.ndarray, video_id: str) -> Dict:
        """Quick computer vision analysis for initial filtering"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect motion if we have previous frames
        motion_detected = False
        if video_id in self.frame_buffers and len(self.frame_buffers[video_id]) > 1:
            prev_frame = self.frame_buffers[video_id][-2]
            diff = cv2.absdiff(gray, cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY))
            motion_score = np.mean(diff)
            motion_detected = motion_score > 30
        
        # Detect objects
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Count significant objects
        significant_objects = 0
        for contour in contours:
            area = cv2.contourArea(contour)
            if 1000 < area < 50000:
                significant_objects += 1
        
        # Simple heuristics for crash indicators
        confidence = 0.0
        if motion_detected and significant_objects > 2:
            confidence = 0.7
        elif significant_objects > 4:
            confidence = 0.5
        
        return {
            'has_crash': confidence > 0.6,
            'confidence': confidence,
            'motion_detected': motion_detected,
            'objects_count': significant_objects
        }
    
    def _analyze_with_gemini(self, frame: np.ndarray) -> Dict:
        """Analyze frame with Gemini VLM"""
        if self.gemini_model is None:
            return {'has_crash': False, 'confidence': 0.0}
        
        try:
            # Convert frame to base64
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Create focused prompt for crash detection
            prompt = """
            Analyze this traffic camera frame for car crashes or accidents. Look specifically for:
            - Vehicle collisions or impacts
            - Damaged vehicles with visible damage
            - Debris scattered on the road
            - Emergency vehicles or people outside cars
            - Unusual traffic patterns indicating an accident
            
            Respond with ONLY a JSON object:
            {
                "has_crash": true/false,
                "confidence": 0.0-1.0,
                "crash_type": "collision/breakdown/fire/other",
                "description": "Brief description of what you see",
                "severity": "low/medium/high"
            }
            """
            
            response = self.gemini_model.generate_content([
                prompt,
                {
                    "mime_type": "image/jpeg",
                    "data": frame_base64
                }
            ])
            
            # Parse response
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3]
            elif response_text.startswith('```'):
                response_text = response_text[3:-3]
            
            result = json.loads(response_text)
            return result
            
        except Exception as e:
            print(f"Error in Gemini analysis: {e}")
            return {'has_crash': False, 'confidence': 0.0, 'description': f'Analysis error: {str(e)}'}
    
    def _get_no_detection_result(self) -> Dict:
        """Return standard no-detection result"""
        return {
            'has_crash': False,
            'confidence': 0.0,
            'crash_type': 'none',
            'description': 'Normal traffic',
            'severity': 'none',
            'method': 'none'
        }
    
    def get_objects_count(self, frame: np.ndarray) -> int:
        """Estimate number of objects in frame"""
        if frame is None:
            return 0
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        significant_objects = 0
        for contour in contours:
            area = cv2.contourArea(contour)
            if 1000 < area < 50000:
                significant_objects += 1
        
        return significant_objects
