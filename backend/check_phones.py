import httpx
import json
import asyncio

async def check_existing_phones():
    """Check existing phone numbers in VAPI"""
    headers = {
        'Authorization': 'Bearer 3b808635-5d81-4a32-89d2-c166337ff921',
        'Content-Type': 'application/json'
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get('https://api.vapi.ai/phone-number', headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.content:
                data = response.json()
                print(f"Existing Phone Numbers: {json.dumps(data, indent=2)}")
                
                if isinstance(data, list):
                    print(f"\nFound {len(data)} phone numbers:")
                    for i, phone in enumerate(data, 1):
                        print(f"{i}. ID: {phone.get('id')}")
                        print(f"   Name: {phone.get('name', 'N/A')}")
                        print(f"   Number: {phone.get('number', 'NO NUMBER')}")
                        print(f"   Provider: {phone.get('provider', 'N/A')}")
                        print(f"   Status: {phone.get('status', 'N/A')}")
                        print()
            else:
                print("No content returned")
                
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_existing_phones())
