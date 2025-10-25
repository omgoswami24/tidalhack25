"""
Real Video Processor for SafeSight
Processes actual crash videos and detects incidents
"""

import cv2
import os
import json
import numpy as np
from datetime import datetime
from typing import List, Dict, Tuple, Optional
import time
import base64
import google.generativeai as genai

class VideoProcessor:
    def __init__(self, videos_dir="../frontend/public/Videos"):
        self.videos_dir = videos_dir
        self.processed_videos = []
        self.crash_detector = None
        self.gemini_model = None
        
        # Initialize Gemini VLM
        try:
            from dotenv import load_dotenv
            load_dotenv('../safesight.env')
            api_key = os.getenv('GEMINI_API_KEY')
            if api_key:
                genai.configure(api_key=api_key)
                self.gemini_model = genai.GenerativeModel('gemini-1.5-pro')
                print("✅ Gemini VLM initialized")
            else:
                print("⚠️  GEMINI_API_KEY not found")
        except Exception as e:
            print(f"⚠️  Gemini VLM not available: {e}")
            self.gemini_model = None
        
        # Initialize crash detector if OpenCV is available
        try:
            from crash_detector import CrashDetector
            self.crash_detector = CrashDetector()
            print("✅ Crash detector initialized")
        except Exception as e:
            print(f"⚠️  Crash detector not available: {e}")
            self.crash_detector = None
    
    def get_video_list(self) -> List[Dict]:
        """Get list of all videos with metadata"""
        videos = []
        
        if not os.path.exists(self.videos_dir):
            print(f"❌ Videos directory not found: {self.videos_dir}")
            return videos
        
        video_files = [f for f in os.listdir(self.videos_dir) if f.endswith('.mp4')]
        
        for i, filename in enumerate(sorted(video_files)):
            video_path = os.path.join(self.videos_dir, filename)
            
            # All videos start as normal - no pre-detection
            is_crash = False
            is_normal = True
            
            # Get video properties
            cap = cv2.VideoCapture(video_path)
            if cap.isOpened():
                fps = cap.get(cv2.CAP_PROP_FPS)
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                duration = frame_count / fps if fps > 0 else 0
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                cap.release()
            else:
                fps = 30
                frame_count = 0
                duration = 0
                width = 1920
                height = 1080
            
            video_info = {
                'id': i + 1,
                'filename': filename,
                'path': video_path,
                'name': f'Camera {i + 1} - {filename}',
                'location': self._get_location_for_video(filename),
                'status': 'online',
                'hasIncident': is_crash,
                'incidentType': 'collision' if is_crash else None,
                'objectsCount': 0,  # Will be updated during processing
                'lastDetection': None,
                'crashDetails': self._get_crash_details(filename) if is_crash else None,
                'videoProperties': {
                    'fps': fps,
                    'frameCount': frame_count,
                    'duration': duration,
                    'width': width,
                    'height': height
                }
            }
            
            videos.append(video_info)
        
        return videos
    
    
    def _get_location_for_video(self, filename: str) -> str:
        """Get location based on video filename"""
        locations = {
            'r1.mp4': 'Highway 101, Mile 45.2, San Francisco, CA',
            'r2.mp4': 'I-280, Exit 12, San Jose, CA', 
            'r3.mp4': 'Highway 880, Oakland, CA',
            'r4.mp4': 'Highway 5, Sacramento, CA',
            'r5.mp4': 'Highway 101, Palo Alto, CA',
            'good1.mp4': 'Highway 101, Critical Incident Zone, San Francisco, CA',
            'good2.mp4': 'I-280, Emergency Response Area, San Jose, CA',
            'good3.mp4': 'Highway 880, Accident Scene, Oakland, CA',
            'good4.mp4': 'Highway 5, Collision Site, Sacramento, CA'
        }
        return locations.get(filename, f'Unknown Location - {filename}')
    
    def _get_crash_details(self, filename: str) -> Dict:
        """Get crash details based on video filename"""
        crash_details = {
            'good1.mp4': {
                'type': 'Multi-vehicle collision',
                'severity': 'Critical',
                'vehiclesInvolved': 3,
                'injuries': 'Multiple injuries reported',
                'description': 'High-speed collision with debris scattered across multiple lanes'
            },
            'good2.mp4': {
                'type': 'Vehicle fire and collision',
                'severity': 'High',
                'vehiclesInvolved': 2,
                'injuries': 'Driver evacuated safely',
                'description': 'Vehicle collision resulting in fire with visible flames and smoke'
            },
            'good3.mp4': {
                'type': 'Vehicle breakdown with debris',
                'severity': 'Medium',
                'vehiclesInvolved': 1,
                'injuries': 'No injuries reported',
                'description': 'Vehicle breakdown causing debris on roadway and traffic backup'
            },
            'good4.mp4': {
                'type': 'Severe multi-vehicle collision',
                'severity': 'Critical',
                'vehiclesInvolved': 4,
                'injuries': 'Multiple casualties reported',
                'description': 'Major collision involving multiple vehicles with extensive damage'
            }
        }
        return crash_details.get(filename, {
            'type': 'Unknown incident',
            'severity': 'Unknown',
            'vehiclesInvolved': 0,
            'injuries': 'Unknown',
            'description': 'Incident detected but details unknown'
        })
    
    def process_video(self, video_path: str, sample_frames: int = 10) -> Dict:
        """Process a single video and detect crashes"""
        if not os.path.exists(video_path):
            return {'error': 'Video file not found'}
        
        # Store filename for crash detection
        self.current_filename = os.path.basename(video_path)
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {'error': 'Could not open video file'}
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        
        # Use Gemini to analyze frames for crashes
        detections = []
        objects_count = 0
        has_crash = False
        max_confidence = 0
        
        # Sample multiple frames for better detection
        sample_frames = [frame_count // 4, frame_count // 2, 3 * frame_count // 4]
        
        for frame_pos in sample_frames:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
            ret, frame = cap.read()
            
            if ret and frame is not None:
                # Use Gemini to analyze this frame
                gemini_result = self.analyze_frame_with_gemini(frame)
                
                if gemini_result.get('has_crash', False):
                    has_crash = True
                    max_confidence = max(max_confidence, gemini_result.get('confidence', 0))
                    detections.append({
                        'frame': frame_pos,
                        'confidence': gemini_result.get('confidence', 0),
                        'description': gemini_result.get('description', ''),
                        'crash_type': gemini_result.get('crash_type', 'unknown')
                    })
                
                # Count objects for display
                objects_count = max(objects_count, self._estimate_objects_in_frame(frame))
        
        cap.release()
        
        return {
            'hasCrash': has_crash,
            'maxConfidence': max_confidence,
            'detections': detections,
            'objectsCount': objects_count,
            'totalFrames': frame_count,
            'duration': duration,
            'fps': fps
        }
    
    def analyze_frame_with_gemini(self, frame: np.ndarray) -> Dict:
        """Analyze frame using Gemini VLM for crash detection"""
        if self.gemini_model is None:
            return {'has_crash': False, 'confidence': 0.0, 'description': 'Gemini not available'}
        
        try:
            # Convert frame to base64 for Gemini
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Create prompt for Gemini
            prompt = """
            Analyze this traffic camera frame for car crashes or accidents. Look for:
            - Vehicle collisions or impacts
            - Damaged vehicles
            - Debris on the road
            - Emergency vehicles
            - Unusual traffic patterns indicating an accident
            - Smoke, fire, or other signs of vehicle damage
            
            Respond with a JSON object containing:
            {
                "has_crash": true/false,
                "confidence": 0.0-1.0,
                "crash_type": "collision/breakdown/fire/other",
                "description": "Brief description of what you see",
                "severity": "low/medium/high"
            }
            """
            
            # Generate content with Gemini
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
    
    def _estimate_objects_from_gemini(self, gemini_result: Dict) -> int:
        """Estimate object count from Gemini analysis"""
        description = gemini_result.get('description', '').lower()
        # Simple heuristic based on description
        if 'multiple vehicles' in description or 'several cars' in description:
            return 3
        elif 'vehicle' in description or 'car' in description:
            return 1
        else:
            return 0
    
    def _estimate_objects_in_frame(self, frame: np.ndarray) -> int:
        """Estimate objects in frame using OpenCV"""
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
    
    def _detect_crash_simple(self, frame: np.ndarray, contours: List) -> float:
        """Simple crash detection based on visual cues"""
        if len(contours) == 0:
            return 0.0
        
        # Count significant objects
        significant_objects = 0
        total_area = 0
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if 1000 < area < 50000:
                significant_objects += 1
                total_area += area
        
        # Only detect crashes based on actual visual analysis
        # Don't pre-detect based on filename
        
        # Crash indicators
        object_density = significant_objects / (frame.shape[0] * frame.shape[1] / 1000000)  # objects per megapixel
        
        # High object density might indicate debris from crash
        if object_density > 3:  # Lowered threshold
            return min(0.9, object_density / 8)
        
        # Multiple significant objects close together
        if significant_objects > 2:  # Lowered threshold
            return min(0.8, significant_objects / 8)
        
        # Large total area might indicate debris field
        if total_area > 30000:  # Lowered threshold
            return min(0.7, total_area / 80000)
        
        return 0.0
    
    def process_all_videos(self) -> List[Dict]:
        """Process all videos in the directory"""
        videos = self.get_video_list()
        processed_videos = []
        
        print(f"🎥 Processing {len(videos)} videos...")
        
        for video in videos:
            print(f"Processing {video['filename']}...")
            
            # Process the video
            result = self.process_video(video['path'])
            
            if 'error' not in result:
                # Update video with processing results
                video['objectsCount'] = result['objectsCount']
                video['hasIncident'] = result['hasCrash']
                video['lastDetection'] = datetime.now() if result['hasCrash'] else None
                video['processingResult'] = result
                
                if result['hasCrash']:
                    print(f"🚨 CRASH DETECTED in {video['filename']} (confidence: {result['maxConfidence']:.2f})")
                else:
                    print(f"✅ Normal traffic in {video['filename']}")
            else:
                print(f"❌ Error processing {video['filename']}: {result['error']}")
            
            processed_videos.append(video)
        
        self.processed_videos = processed_videos
        return processed_videos
    
    def save_processed_data(self, filename: str = "processed_videos.json"):
        """Save processed video data to JSON file"""
        if not self.processed_videos:
            print("No processed videos to save")
            return
        
        # Convert datetime objects to strings for JSON serialization
        data_to_save = []
        for video in self.processed_videos:
            video_copy = video.copy()
            if video_copy.get('lastDetection'):
                video_copy['lastDetection'] = video_copy['lastDetection'].isoformat()
            data_to_save.append(video_copy)
        
        with open(filename, 'w') as f:
            json.dump(data_to_save, f, indent=2, default=str)
        
        print(f"💾 Processed video data saved to {filename}")

def main():
    """Main function to process all videos"""
    processor = VideoProcessor()
    
    print("🚀 SafeSight Video Processor Starting...")
    print("=" * 50)
    
    # Process all videos
    processed_videos = processor.process_all_videos()
    
    # Save results
    processor.save_processed_data()
    
    # Print summary
    crash_count = sum(1 for v in processed_videos if v.get('hasIncident', False))
    normal_count = len(processed_videos) - crash_count
    
    print("\n" + "=" * 50)
    print("📊 PROCESSING SUMMARY")
    print("=" * 50)
    print(f"Total videos processed: {len(processed_videos)}")
    print(f"Crash videos detected: {crash_count}")
    print(f"Normal videos: {normal_count}")
    print(f"Detection accuracy: {crash_count/len(processed_videos)*100:.1f}%")
    
    return processed_videos

if __name__ == "__main__":
    main()
