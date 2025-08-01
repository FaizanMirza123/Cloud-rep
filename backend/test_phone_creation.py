import httpx
import json
import asyncio

async def test_phone_creation():
    """Test phone number creation with different providers"""
    headers = {
        'Authorization': 'Bearer b53d60fd-f374-4af6-b586-3d2ff3463efa',
        'Content-Type': 'application/json'
    }
    
    # Test cases for different providers
    test_cases = [
        {
            "name": "Test BYO Phone",
            "payload": {
                "provider": "byo-phone-number",
                "name": "My BYO Phone",
                "number": "+15551234567",
                "credentialId": "test-credential-id"
            }
        },
        {
            "name": "Test Twilio Phone (will fail without real credentials)",
            "payload": {
                "provider": "twilio",
                "name": "My Twilio Phone",
                "areaCode": "555",
                "accountSid": "test-sid",
                "authToken": "test-token"
            }
        },
        {
            "name": "Test VAPI Phone (placeholder)",
            "payload": {
                "provider": "vapi",
                "name": "My VAPI Phone"
            }
        }
    ]
    
    async with httpx.AsyncClient() as client:
        print("=== Testing Phone Number Creation ===\n")
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"{i}. {test_case['name']}")
            print(f"Payload: {json.dumps(test_case['payload'], indent=2)}")
            
            try:
                response = await client.post(
                    'https://api.vapi.ai/phone-number',
                    headers=headers,
                    json=test_case['payload']
                )
                
                print(f"Status: {response.status_code}")
                
                if response.content:
                    result = response.json()
                    print(f"Response: {json.dumps(result, indent=2)}")
                    
                    # Check for the key fields we care about
                    if response.status_code == 201 or response.status_code == 200:
                        print("✅ Success!")
                        print(f"- ID: {result.get('id', 'N/A')}")
                        print(f"- Name: {result.get('name', 'N/A')}")
                        print(f"- Number: {result.get('number', 'N/A')}")
                        print(f"- Provider: {result.get('provider', 'N/A')}")
                        print(f"- Status: {result.get('status', 'N/A')}")
                    else:
                        print("❌ Failed!")
                else:
                    print("No response content")
                    
            except Exception as e:
                print(f"❌ Error: {str(e)}")
            
            print("-" * 50)
            print()

if __name__ == "__main__":
    asyncio.run(test_phone_creation())
