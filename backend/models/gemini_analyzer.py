"""
Google Gemini VLM Integration for SafeSight
Handles semantic analysis of traffic scenes using Gemini Vision Language Model
"""

import base64
import json
import google.generativeai as genai
from typing import Dict, List, Optional
import cv2
import numpy as np
from PIL import Image
import io

class GeminiAnalyzer:
    def __init__(self, api_key: str, model_name: str = 'gemini-1.5-flash'):
        """
        Initialize Gemini analyzer
        
        Args:
            api_key: Google Gemini API key
            model_name: Name of the Gemini model to use
        """
        self.api_key = api_key
        self.model_name = model_name
        self.model = None
        self.load_model()
        
    def load_model(self):
        """Load Gemini model"""
        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
            print(f"Gemini model '{self.model_name}' loaded successfully")
        except Exception as e:
            print(f"Error loading Gemini model: {e}")
            self.model = None
    
    def analyze_traffic_scene(self, frame: np.ndarray, context: str = "") -> Dict:
        """
        Analyze traffic scene for incidents using Gemini VLM
        
        Args:
            frame: Input image frame
            context: Additional context about the scene
            
        Returns:
            Dictionary with analysis results
        """
        if self.model is None:
            return self._get_default_response()
        
        try:
            # Convert frame to base64
            image_data = self._frame_to_base64(frame)
            
            # Create analysis prompt
            prompt = self._create_analysis_prompt(context)
            
            # Generate analysis
            response = self.model.generate_content([
                prompt,
                {
                    "mime_type": "image/jpeg",
                    "data": image_data
                }
            ])
            
            # Parse response
            result = self._parse_response(response.text)
            return result
            
        except Exception as e:
            print(f"Error in Gemini analysis: {e}")
            return self._get_default_response()
    
    def _frame_to_base64(self, frame: np.ndarray) -> str:
        """
        Convert OpenCV frame to base64 string
        
        Args:
            frame: OpenCV frame
            
        Returns:
            Base64 encoded image string
        """
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Convert to PIL Image
        pil_image = Image.fromarray(frame_rgb)
        
        # Convert to base64
        buffer = io.BytesIO()
        pil_image.save(buffer, format='JPEG', quality=85)
        image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return image_data
    
    def _create_analysis_prompt(self, context: str = "") -> str:
        """
        Create analysis prompt for Gemini
        
        Args:
            context: Additional context
            
        Returns:
            Analysis prompt string
        """
        prompt = f"""
        You are an AI traffic safety analyst. Analyze this traffic camera image for potential incidents, emergencies, or safety concerns.
        
        {f"Context: {context}" if context else ""}
        
        Look for the following types of incidents:
        1. Vehicle collisions or accidents
        2. Vehicles on fire or smoking
        3. Overturned vehicles
        4. Debris on the road
        5. Emergency vehicles (ambulance, fire truck, police)
        6. Unusual traffic patterns or congestion
        7. Pedestrians in dangerous situations
        8. Road construction or maintenance activities
        9. Weather-related hazards (flooding, ice, etc.)
        10. Any other safety concerns
        
        Respond with a JSON object containing:
        {{
            "has_incident": boolean,
            "incident_type": "collision|fire|breakdown|emergency_vehicle|pedestrian_danger|debris|construction|weather|other|none",
            "severity": "low|medium|high|critical",
            "description": "detailed description of what you observe in the image",
            "confidence": float (0.0 to 1.0),
            "location_details": "description of the location within the image",
            "recommended_actions": ["action1", "action2", ...],
            "vehicles_detected": integer,
            "pedestrians_detected": integer,
            "emergency_vehicles_detected": integer
        }}
        
        Guidelines:
        - Be conservative in incident detection - only flag clear incidents
        - Provide detailed descriptions of what you see
        - Consider the context and normal traffic patterns
        - Rate severity based on potential danger to people and property
        - If no incident is detected, set has_incident to false and incident_type to "none"
        - Confidence should reflect how certain you are about your analysis
        """
        
        return prompt
    
    def _parse_response(self, response_text: str) -> Dict:
        """
        Parse Gemini response text
        
        Args:
            response_text: Raw response from Gemini
            
        Returns:
            Parsed response dictionary
        """
        try:
            # Clean response text
            cleaned_text = response_text.strip()
            
            # Remove markdown code blocks if present
            if cleaned_text.startswith('```json'):
                cleaned_text = cleaned_text[7:-3]
            elif cleaned_text.startswith('```'):
                cleaned_text = cleaned_text[3:-3]
            
            # Parse JSON
            result = json.loads(cleaned_text)
            
            # Validate required fields
            required_fields = ['has_incident', 'incident_type', 'severity', 'description', 'confidence']
            for field in required_fields:
                if field not in result:
                    result[field] = self._get_default_value(field)
            
            # Ensure confidence is a float
            result['confidence'] = float(result.get('confidence', 0.0))
            
            # Ensure counts are integers
            result['vehicles_detected'] = int(result.get('vehicles_detected', 0))
            result['pedestrians_detected'] = int(result.get('pedestrians_detected', 0))
            result['emergency_vehicles_detected'] = int(result.get('emergency_vehicles_detected', 0))
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"Error parsing Gemini response: {e}")
            print(f"Response text: {response_text}")
            return self._get_default_response()
        except Exception as e:
            print(f"Error processing Gemini response: {e}")
            return self._get_default_response()
    
    def _get_default_response(self) -> Dict:
        """Get default response when analysis fails"""
        return {
            "has_incident": False,
            "incident_type": "none",
            "severity": "low",
            "description": "Analysis failed - unable to process image",
            "confidence": 0.0,
            "location_details": "Unknown",
            "recommended_actions": [],
            "vehicles_detected": 0,
            "pedestrians_detected": 0,
            "emergency_vehicles_detected": 0
        }
    
    def _get_default_value(self, field: str):
        """Get default value for a field"""
        defaults = {
            'has_incident': False,
            'incident_type': 'none',
            'severity': 'low',
            'description': 'No description available',
            'confidence': 0.0,
            'location_details': 'Unknown location',
            'recommended_actions': [],
            'vehicles_detected': 0,
            'pedestrians_detected': 0,
            'emergency_vehicles_detected': 0
        }
        return defaults.get(field, None)
    
    def analyze_batch(self, frames: List[np.ndarray], context: str = "") -> List[Dict]:
        """
        Analyze multiple frames in batch
        
        Args:
            frames: List of image frames
            context: Additional context
            
        Returns:
            List of analysis results
        """
        results = []
        for frame in frames:
            result = self.analyze_traffic_scene(frame, context)
            results.append(result)
        return results
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        if self.model is None:
            return {'loaded': False}
        
        return {
            'loaded': True,
            'model_name': self.model_name,
            'api_key_configured': bool(self.api_key)
        }
    
    def test_connection(self) -> bool:
        """Test connection to Gemini API"""
        try:
            if self.model is None:
                return False
            
            # Create a simple test image
            test_image = np.zeros((100, 100, 3), dtype=np.uint8)
            test_image[:] = (128, 128, 128)  # Gray image
            
            # Try to analyze the test image
            result = self.analyze_traffic_scene(test_image, "Test connection")
            return result is not None
            
        except Exception as e:
            print(f"Gemini connection test failed: {e}")
            return False
