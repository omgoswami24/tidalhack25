"""
Sample video data generator for SafeSight demo
Creates mock video feeds with different crash scenarios
"""

import json
import random
from datetime import datetime, timedelta

def generate_sample_videos():
    """Generate sample video data with various crash scenarios"""
    
    video_scenarios = [
        {
            "id": 1,
            "name": "Highway 101 - Northbound",
            "location": "Highway 101, Mile 45.2, San Francisco, CA",
            "status": "online",
            "hasIncident": True,
            "incidentType": "collision",
            "objectsCount": 4,
            "lastDetection": datetime.now() - timedelta(minutes=2),
            "crashDetails": {
                "type": "Multi-vehicle collision",
                "severity": "Critical",
                "vehiclesInvolved": 3,
                "injuries": "Multiple injuries reported",
                "description": "Three vehicles involved in high-speed collision with debris scattered across lanes"
            }
        },
        {
            "id": 2,
            "name": "I-280 - Southbound",
            "location": "I-280, Exit 12, San Jose, CA",
            "status": "online",
            "hasIncident": False,
            "incidentType": None,
            "objectsCount": 2,
            "lastDetection": None,
            "crashDetails": None
        },
        {
            "id": 3,
            "name": "Highway 880 - Eastbound",
            "location": "Highway 880, Oakland, CA",
            "status": "online",
            "hasIncident": True,
            "incidentType": "fire",
            "objectsCount": 1,
            "lastDetection": datetime.now() - timedelta(minutes=5),
            "crashDetails": {
                "type": "Vehicle fire",
                "severity": "High",
                "vehiclesInvolved": 1,
                "injuries": "Driver evacuated safely",
                "description": "Vehicle fire with visible flames and smoke"
            }
        },
        {
            "id": 4,
            "name": "Highway 5 - Northbound",
            "location": "Highway 5, Sacramento, CA",
            "status": "online",
            "hasIncident": False,
            "incidentType": None,
            "objectsCount": 3,
            "lastDetection": None,
            "crashDetails": None
        },
        {
            "id": 5,
            "name": "Highway 101 - Southbound",
            "location": "Highway 101, Palo Alto, CA",
            "status": "offline",
            "hasIncident": False,
            "incidentType": None,
            "objectsCount": 0,
            "lastDetection": None,
            "crashDetails": None
        },
        {
            "id": 6,
            "name": "I-80 - Westbound",
            "location": "I-80, Berkeley, CA",
            "status": "online",
            "hasIncident": True,
            "incidentType": "breakdown",
            "objectsCount": 2,
            "lastDetection": datetime.now() - timedelta(minutes=1),
            "crashDetails": {
                "type": "Vehicle breakdown with debris",
                "severity": "Medium",
                "vehiclesInvolved": 1,
                "injuries": "No injuries reported",
                "description": "Vehicle breakdown with debris on roadway causing traffic backup"
            }
        }
    ]
    
    return video_scenarios

def generate_detection_timeline(video_id, has_incident=False):
    """Generate a timeline of detections for a video"""
    detections = []
    base_time = datetime.now() - timedelta(minutes=10)
    
    # Generate normal traffic detections
    for i in range(8):
        detection_time = base_time + timedelta(minutes=i)
        detections.append({
            "timestamp": detection_time,
            "type": "Vehicle",
            "confidence": random.uniform(0.7, 0.95),
            "description": "Vehicle detected moving normally",
            "severity": "Low"
        })
    
    # Add incident detection if video has incident
    if has_incident:
        incident_time = base_time + timedelta(minutes=random.randint(3, 7))
        detections.append({
            "timestamp": incident_time,
            "type": "Incident",
            "confidence": random.uniform(0.85, 0.98),
            "description": "Traffic incident detected - immediate attention required",
            "severity": "Critical"
        })
    
    return sorted(detections, key=lambda x: x['timestamp'])

if __name__ == "__main__":
    videos = generate_sample_videos()
    
    # Save to JSON file for frontend to use
    with open('sample_videos.json', 'w') as f:
        json.dump(videos, f, indent=2, default=str)
    
    print("Sample video data generated successfully!")
    print(f"Generated {len(videos)} video scenarios")
    
    # Print summary
    incident_count = sum(1 for v in videos if v['hasIncident'])
    print(f"Videos with incidents: {incident_count}")
    print(f"Online cameras: {sum(1 for v in videos if v['status'] == 'online')}")
