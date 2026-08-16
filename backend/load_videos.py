"""
Load processed video data for the frontend
"""

import json
import os
import random

# Resolve the data file next to this module so it loads regardless of the
# process working directory (dev server, gunicorn, or serverless handler).
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         'processed_videos.json')


def load_processed_videos():
    """Load processed video data from JSON file"""
    try:
        with open(DATA_FILE, 'r') as f:
            videos = json.load(f)
        return videos
    except FileNotFoundError:
        print("No processed videos found, using default data")
        return []

def get_video_data():
    """Get video data for the frontend with randomized positions"""
    videos = load_processed_videos()
    
    # Convert the data to the format expected by the frontend
    formatted_videos = []
    
    for video in videos:
        formatted_video = {
            'id': video['id'],
            'name': video['name'],
            'location': video['location'],
            'status': video['status'],
            'hasIncident': video.get('hasIncident', False),
            'incidentType': video.get('incidentType'),
            'objectsCount': video.get('objectsCount', 0),
            'lastDetection': video.get('lastDetection'),
            'crashDetails': video.get('crashDetails'),
            'filename': video.get('filename', ''),
            'isLive': video.get('isLive', False),
            'liveImageUrl': video.get('liveImageUrl'),
            'streamUrl': video.get('streamUrl'),
            'tz': video.get('tz'),
            'coordinates': video.get('coordinates'),
            'videoProperties': video.get('videoProperties', {}),
            'processingResult': video.get('processingResult', {})
        }
        formatted_videos.append(formatted_video)
    
    # Recorded incident-demo cameras first, then live feeds
    formatted_videos.sort(key=lambda v: (not v.get('filename'), v['id']))

    # Reassign IDs to maintain consistency with frontend expectations
    for i, video in enumerate(formatted_videos):
        video['id'] = i + 1

    return formatted_videos

if __name__ == "__main__":
    videos = get_video_data()
    print(f"Loaded {len(videos)} videos")
    for video in videos:
        status = "🚨 CRASH" if video['hasIncident'] else "✅ Normal"
        print(f"{status} - {video['name']} ({video['filename']})")
