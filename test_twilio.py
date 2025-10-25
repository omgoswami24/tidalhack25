#!/usr/bin/env python3
"""
Test script for Twilio Voice integration
"""
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Load environment variables
load_dotenv('safesight.env')

from twilio_voice_service import twilio_voice_service

def test_twilio_connection():
    """Test Twilio connection"""
    print("🧪 Testing Twilio Voice Service...")
    print(f"📞 Account SID: {twilio_voice_service.account_sid}")
    print(f"📞 Twilio Phone: {twilio_voice_service.twilio_phone}")
    print(f"📞 Target Phone: {twilio_voice_service.target_phone}")
    
    # Test connection
    if twilio_voice_service.test_connection():
        print("✅ Twilio connection test successful!")
        return True
    else:
        print("❌ Twilio connection test failed!")
        return False

def test_emergency_call():
    """Test emergency call (commented out to avoid actual calls)"""
    print("\n🧪 Testing Emergency Call Function...")
    
    # Sample incident data
    incident_data = {
        'type': 'collision',
        'location': 'Highway 101, Mile 45.2, San Francisco, CA',
        'severity': 'High',
        'description': 'Multiple vehicle collision detected'
    }
    
    print(f"📝 Test incident data: {incident_data}")
    
    # Uncomment the line below to actually make a test call
    # result = twilio_voice_service.make_emergency_call(incident_data)
    # print(f"📞 Call result: {result}")
    
    print("⚠️  Emergency call test skipped to avoid actual calls")
    print("   Uncomment the call in test_emergency_call() to test actual calls")
    
    return True

if __name__ == "__main__":
    print("🚀 Twilio Voice Service Test")
    print("=" * 40)
    
    # Test connection
    connection_ok = test_twilio_connection()
    
    if connection_ok:
        # Test emergency call function
        test_emergency_call()
        print("\n✅ All tests completed!")
    else:
        print("\n❌ Connection test failed. Please check your Twilio credentials.")
