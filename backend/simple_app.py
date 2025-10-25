import os
import base64
import json
import io
import time
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np
from PIL import Image
import boto3
import google.generativeai as genai
from crash_detector import CrashDetector
from load_videos import get_video_data

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure AWS services
try:
    aws_session = boto3.Session(
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION', 'us-west-2')
    )
    s3_client = aws_session.client('s3')
    sns_client = aws_session.client('sns')
    dynamodb = aws_session.resource('dynamodb')
    AWS_AVAILABLE = True
except Exception as e:
    print(f"AWS not available: {e}")
    AWS_AVAILABLE = False

# Configure Google Gemini
try:
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
    GEMINI_AVAILABLE = True
except Exception as e:
    print(f"Gemini not available: {e}")
    GEMINI_AVAILABLE = False

# Initialize crash detector
crash_detector = CrashDetector()

# Load real video data
real_videos = get_video_data()

# Global variables for detection state
detection_active = False
detection_stats = {
    'total_detections': 0,
    'active_incidents': 0,
    'last_detection': None
}

# Mock incidents for demo
mock_incidents = [
    {
        'id': 1,
        'timestamp': datetime.now().isoformat(),
        'type': 'Vehicle Collision',
        'severity': 'high',
        'location': 'Highway 101, Mile 45.2',
        'description': 'Two vehicles collided on the highway with visible damage',
        'image': '/api/placeholder/300/200',
        'status': 'alerted'
    },
    {
        'id': 2,
        'timestamp': datetime.now().isoformat(),
        'type': 'Vehicle Breakdown',
        'severity': 'medium',
        'location': 'I-280, Exit 12',
        'description': 'Vehicle stopped on shoulder with hazard lights',
        'image': '/api/placeholder/300/200',
        'status': 'monitoring'
    }
]

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'detection_active': detection_active,
        'aws_available': AWS_AVAILABLE,
        'gemini_available': GEMINI_AVAILABLE
    })

@app.route('/api/start-detection', methods=['POST'])
def start_detection():
    """Start AI detection system"""
    global detection_active
    detection_active = True
    detection_stats['last_detection'] = datetime.now().isoformat()
    
    return jsonify({
        'status': 'success',
        'message': 'Detection started',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/stop-detection', methods=['POST'])
def stop_detection():
    """Stop AI detection system"""
    global detection_active
    detection_active = False
    
    return jsonify({
        'status': 'success',
        'message': 'Detection stopped',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/process-frame', methods=['POST'])
def process_frame():
    """Process a single frame for detection"""
    global detection_stats
    
    # Mock detection data
    detections = [
        {
            'x': 100, 'y': 150, 'width': 200, 'height': 100,
            'label': 'Vehicle', 'confidence': 0.95, 'type': 'normal'
        },
        {
            'x': 300, 'y': 200, 'width': 180, 'height': 90,
            'label': 'Vehicle', 'confidence': 0.87, 'type': 'normal'
        }
    ]
    
    # Simulate incident detection (10% chance)
    if detection_stats['total_detections'] % 10 == 0:
        incident = {
            'has_incident': True,
            'incident_type': 'collision',
            'severity': 'high',
            'description': 'Two vehicles collided with visible damage',
            'confidence': 0.95
        }
        detection_stats['active_incidents'] += 1
        detection_stats['last_detection'] = datetime.now().isoformat()
        
        return jsonify({
            'detections': detections,
            'incident': incident,
            'alert_sent': True,
            'incident_id': f"incident_{int(time.time())}"
        })
    
    # Update detection stats
    detection_stats['total_detections'] += 1
    
    return jsonify({
        'detections': detections,
        'gemini_analysis': None,
        'stats': detection_stats
    })

@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    """Get list of incidents"""
    return jsonify({
        'incidents': mock_incidents,
        'count': len(mock_incidents)
    })

@app.route('/api/videos', methods=['GET'])
def get_videos():
    """Get all video feeds with real data"""
    return jsonify(real_videos)

@app.route('/api/videos/<int:video_id>', methods=['GET'])
def get_video_details(video_id):
    """Get details for a specific video"""
    video = next((v for v in real_videos if v['id'] == video_id), None)
    if video:
        return jsonify(video)
    return jsonify({'error': 'Video not found'}), 404

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get detection statistics"""
    return jsonify({
        'detection_active': detection_active,
        'stats': detection_stats
    })

@app.route('/api/upload-video', methods=['POST'])
def upload_video():
    """Upload video file for processing"""
    return jsonify({
        'status': 'success',
        'message': 'Video uploaded successfully (mock)',
        'video_url': 'mock://video/uploaded'
    })

if __name__ == '__main__':
    print("🚀 SafeSight Backend Starting...")
    print(f"✅ AWS Available: {AWS_AVAILABLE}")
    print(f"✅ Gemini Available: {GEMINI_AVAILABLE}")
    print("🌐 Backend running on http://localhost:5001")
    app.run(debug=True, host='0.0.0.0', port=5001)
