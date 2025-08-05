#!/usr/bin/env python3

import requests
import json

# Test the recordings endpoints
BASE_URL = "https://fastapi123.duckdns.org"

def test_get_recordings():
    """Test getting recordings"""
    try:
        # First, let's test without authentication to see the response
        response = requests.get(f"{BASE_URL}/calls/recordings")
        print(f"GET /calls/recordings - Status: {response.status_code}")
        
        if response.status_code == 401:
            print("Authentication required - this is expected")
        else:
            print(f"Response: {response.text[:500]}...")
            
    except Exception as e:
        print(f"Error testing GET recordings: {e}")

def test_refresh_recordings():
    """Test refreshing recordings"""
    try:
        # Test without authentication
        response = requests.post(f"{BASE_URL}/calls/recordings/refresh")
        print(f"POST /calls/recordings/refresh - Status: {response.status_code}")
        
        if response.status_code == 401:
            print("Authentication required - this is expected")
        else:
            print(f"Response: {response.text[:500]}...")
            
    except Exception as e:
        print(f"Error testing POST refresh: {e}")

def test_server_health():
    """Test if server is running"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Server health check - Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"Error testing server health: {e}")

if __name__ == "__main__":
    print("Testing Call Recordings API endpoints...")
    print("=" * 50)
    
    test_server_health()
    print()
    test_get_recordings()
    print()
    test_refresh_recordings()
    print()
    print("Test completed!")
