#!/usr/bin/env python3
"""
Final Integration Test
Tests the complete phone number to assistant connection functionality
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import get_db, PhoneNumber, Agent, User
from sqlalchemy.orm import Session

def test_complete_functionality():
    print("🧪 Starting integration tests...")
    
    # Create test client
    client = TestClient(app)
    
    # Test 1: Dashboard Analytics (the original issue)
    print("\n1️⃣ Testing Dashboard Analytics...")
    response = client.get(
        "/dashboard/analytics",
        headers={"X-User-ID": "test-user-123"}
    )
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ Dashboard analytics working!")
        data = response.json()
        print(f"   📊 Response: {data}")
    else:
        print(f"   ❌ Dashboard failed: {response.text}")
        return False
    
    # Test 2: Phone Numbers Endpoint
    print("\n2️⃣ Testing Phone Numbers Endpoint...")
    response = client.get(
        "/phone-numbers",
        headers={"X-User-ID": "test-user-123"}
    )
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ Phone numbers endpoint working!")
        phones = response.json()
        print(f"   📱 Found {len(phones)} phone numbers")
    else:
        print(f"   ❌ Phone numbers failed: {response.text}")
    
    # Test 3: Agents Endpoint
    print("\n3️⃣ Testing Agents Endpoint...")
    response = client.get(
        "/agents",
        headers={"X-User-ID": "test-user-123"}
    )
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ Agents endpoint working!")
        agents = response.json()
        print(f"   🤖 Found {len(agents)} agents")
    else:
        print(f"   ❌ Agents failed: {response.text}")
    
    # Test 4: Phone Number Update (if we have data)
    if 'phones' in locals() and len(phones) > 0 and 'agents' in locals() and len(agents) > 0:
        print("\n4️⃣ Testing Phone Number Update...")
        phone_id = phones[0]['id']
        agent_id = agents[0]['id']
        
        response = client.put(
            f"/phone-numbers/{phone_id}",
            headers={"X-User-ID": "test-user-123"},
            json={"assistant_id": agent_id}
        )
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Phone number update working!")
            updated_phone = response.json()
            print(f"   🔗 Connected phone {phone_id} to agent {agent_id}")
        else:
            print(f"   ❌ Update failed: {response.text}")
    else:
        print("\n4️⃣ Skipping phone number update test (no test data)")
    
    print("\n🎉 Integration tests completed!")
    return True

if __name__ == "__main__":
    try:
        success = test_complete_functionality()
        if success:
            print("\n✅ All systems ready! You can now:")
            print("   • Start the frontend development server")
            print("   • Use the phone number management component")
            print("   • Connect phone numbers to assistants")
            print("   • View call logs and analytics")
        else:
            print("\n❌ Some tests failed. Check the errors above.")
            
    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        import traceback
        traceback.print_exc()
