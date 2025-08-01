#!/usr/bin/env python3
"""
Test Dashboard Endpoint
"""

import sys
import os
import requests
import time
import subprocess
import threading

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_dashboard():
    """Test the dashboard endpoint"""
    try:
        # First run the migration
        from database import engine, Base, create_tables
        print("Running database migration...")
        create_tables()
        print("✓ Database migration completed!")
        
        # Test the endpoint
        print("\nTesting dashboard endpoint...")
        from main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Test the dashboard analytics endpoint
        response = client.get(
            "/dashboard/analytics", 
            headers={"X-User-ID": "test-user-123"}
        )
        
        print(f"Response status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Dashboard endpoint working!")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing dashboard: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_dashboard()
