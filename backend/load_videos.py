"""
Load processed video data for the frontend
"""

import json
import os
import random

def load_processed_videos():
    """Load processed video data from JSON file"""
    try:
        with open('processed_videos.json', 'r') as f:
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
            'filename': video['filename'],
            'videoProperties': video.get('videoProperties', {}),
            'processingResult': video.get('processingResult', {})
        }
        formatted_videos.append(formatted_video)
    
    # Randomize the order of videos each time
    random.shuffle(formatted_videos)
    
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
