import os
import base64
import json
import io
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np
from PIL import Image
import boto3
import google.generativeai as genai

# Import OpenCV with error handling
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    print("OpenCV not available, using mock detection")
    OPENCV_AVAILABLE = False

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure AWS services
aws_session = boto3.Session(
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'us-east-1')
)

s3_client = aws_session.client('s3')
sns_client = aws_session.client('sns')
dynamodb = aws_session.resource('dynamodb')

# Configure Google Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# Global variables for detection state
detection_active = False
detection_stats = {
    'total_detections': 0,
    'active_incidents': 0,
    'last_detection': None
}

# Initialize YOLO model (will be loaded when needed)
yolo_model = None

def load_yolo_model():
    """Load YOLO model for object detection"""
    global yolo_model
    try:
        from ultralytics import YOLO
        yolo_model = YOLO('yolov8n.pt')  # Load nano model for faster inference
        print("YOLO model loaded successfully")
    except Exception as e:
        print(f"Error loading YOLO model: {e}")
        yolo_model = None

def detect_objects(frame):
    """Detect objects in frame using YOLO"""
    if yolo_model is None:
        return []
    
    try:
        results = yolo_model(frame, verbose=False)
        detections = []
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = box.conf[0].cpu().numpy()
                    class_id = int(box.cls[0].cpu().numpy())
                    class_name = yolo_model.names[class_id]
                    
                    detections.append({
                        'x': int(x1),
                        'y': int(y1),
                        'width': int(x2 - x1),
                        'height': int(y2 - y1),
                        'label': class_name,
                        'confidence': float(confidence),
                        'type': 'normal'
                    })
        
        return detections
    except Exception as e:
        print(f"Error in object detection: {e}")
        return []

def analyze_with_gemini(frame):
    """Analyze frame with Gemini VLM for incident detection"""
    try:
        # Convert frame to base64
        _, buffer = cv2.imencode('.jpg', frame)
        image_data = base64.b64encode(buffer).decode('utf-8')
        
        # Create prompt for incident detection
        prompt = """
        Analyze this traffic camera image for potential incidents or emergencies. Look for:
        - Vehicle collisions or accidents
        - Vehicles on fire or smoking
        - Overturned vehicles
        - Debris on the road
        - Emergency vehicles
        - Unusual traffic patterns
        - Pedestrians in dangerous situations
        
        Respond with a JSON object containing:
        {
            "has_incident": boolean,
            "incident_type": "collision|fire|breakdown|other|none",
            "severity": "low|medium|high",
            "description": "detailed description of what you see",
            "confidence": float (0-1)
        }
        
        If no incident is detected, set has_incident to false and incident_type to "none".
        """
        
        # Generate content with Gemini
        response = gemini_model.generate_content([
            prompt,
            {
                "mime_type": "image/jpeg",
                "data": image_data
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
        return {
            "has_incident": False,
            "incident_type": "none",
            "severity": "low",
            "description": "Analysis failed",
            "confidence": 0.0
        }

def send_alert(incident_data):
    """Send alert via AWS SNS"""
    try:
        sns_topic_arn = os.getenv('SNS_TOPIC_ARN')
        if not sns_topic_arn:
            print("SNS topic ARN not configured")
            return False
        
        message = {
            "incident": {
                "type": incident_data['incident_type'],
                "severity": incident_data['severity'],
                "description": incident_data['description'],
                "timestamp": datetime.now().isoformat(),
                "location": "Highway 101, Mile 45.2",  # Mock location
                "confidence": incident_data['confidence']
            }
        }
        
        response = sns_client.publish(
            TopicArn=sns_topic_arn,
            Message=json.dumps(message),
            Subject=f"Traffic Incident Alert: {incident_data['incident_type'].title()}"
        )
        
        print(f"Alert sent: {response['MessageId']}")
        return True
        
    except Exception as e:
        print(f"Error sending alert: {e}")
        return False

def save_incident_to_db(incident_data, image_data):
    """Save incident to DynamoDB"""
    try:
        table_name = os.getenv('DYNAMODB_TABLE_NAME', 'safesight-incidents')
        table = dynamodb.Table(table_name)
        
        incident_id = f"incident_{int(time.time())}"
        
        # Upload image to S3
        s3_bucket = os.getenv('S3_BUCKET_NAME')
        image_key = f"incidents/{incident_id}.jpg"
        
        if s3_bucket:
            s3_client.put_object(
                Bucket=s3_bucket,
                Key=image_key,
                Body=image_data,
                ContentType='image/jpeg'
            )
        
        # Save to DynamoDB
        item = {
            'incident_id': incident_id,
            'timestamp': datetime.now().isoformat(),
            'incident_type': incident_data['incident_type'],
            'severity': incident_data['severity'],
            'description': incident_data['description'],
            'confidence': incident_data['confidence'],
            'location': 'Highway 101, Mile 45.2',
            'image_url': f"s3://{s3_bucket}/{image_key}" if s3_bucket else None,
            'status': 'alerted'
        }
        
        table.put_item(Item=item)
        print(f"Incident saved to database: {incident_id}")
        return incident_id
        
    except Exception as e:
        print(f"Error saving incident to database: {e}")
        return None

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'detection_active': detection_active
    })

@app.route('/api/start-detection', methods=['POST'])
def start_detection():
    """Start AI detection system"""
    global detection_active
    
    if yolo_model is None:
        load_yolo_model()
    
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
    
    try:
        # Get frame data from request
        data = request.get_json()
        if 'frame' not in data:
            return jsonify({'error': 'No frame data provided'}), 400
        
        # Decode base64 frame
        frame_data = base64.b64decode(data['frame'])
        nparr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({'error': 'Invalid frame data'}), 400
        
        # Detect objects
        detections = detect_objects(frame)
        
        # Analyze with Gemini (every 5th frame to reduce API calls)
        gemini_result = None
        if detection_stats['total_detections'] % 5 == 0:
            gemini_result = analyze_with_gemini(frame)
            
            # Check for incidents
            if gemini_result.get('has_incident', False):
                incident_data = gemini_result
                
                # Send alert
                alert_sent = send_alert(incident_data)
                
                # Save to database
                _, buffer = cv2.imencode('.jpg', frame)
                incident_id = save_incident_to_db(incident_data, buffer.tobytes())
                
                # Update stats
                detection_stats['active_incidents'] += 1
                detection_stats['last_detection'] = datetime.now().isoformat()
                
                return jsonify({
                    'detections': detections,
                    'incident': incident_data,
                    'alert_sent': alert_sent,
                    'incident_id': incident_id
                })
        
        # Update detection stats
        detection_stats['total_detections'] += 1
        
        return jsonify({
            'detections': detections,
            'gemini_analysis': gemini_result,
            'stats': detection_stats
        })
        
    except Exception as e:
        print(f"Error processing frame: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    """Get list of incidents"""
    try:
        table_name = os.getenv('DYNAMODB_TABLE_NAME', 'safesight-incidents')
        table = dynamodb.Table(table_name)
        
        response = table.scan()
        incidents = response.get('Items', [])
        
        # Sort by timestamp (newest first)
        incidents.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'incidents': incidents,
            'count': len(incidents)
        })
        
    except Exception as e:
        print(f"Error fetching incidents: {e}")
        return jsonify({'error': str(e)}), 500

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
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({'error': 'No video file selected'}), 400
        
        # Save video to S3
        s3_bucket = os.getenv('S3_BUCKET_NAME')
        if not s3_bucket:
            return jsonify({'error': 'S3 bucket not configured'}), 500
        
        video_key = f"videos/{int(time.time())}_{video_file.filename}"
        s3_client.put_object(
            Bucket=s3_bucket,
            Key=video_key,
            Body=video_file.read(),
            ContentType=video_file.content_type
        )
        
        return jsonify({
            'status': 'success',
            'video_url': f"s3://{s3_bucket}/{video_key}",
            'message': 'Video uploaded successfully'
        })
        
    except Exception as e:
        print(f"Error uploading video: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Load YOLO model on startup
    load_yolo_model()
    
    # Run Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)
