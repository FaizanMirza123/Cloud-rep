import httpx
import json
import asyncio

async def test_vapi():
    headers = {
        'Authorization': 'Bearer 3b808635-5d81-4a32-89d2-c166337ff921',
        'Content-Type': 'application/json'
    }
    
    async with httpx.AsyncClient() as client:
        # Get existing phone numbers
        response = await client.get('https://api.vapi.ai/phone-number', headers=headers)
        print('Status:', response.status_code)
        if response.content:
            data = response.json()
            print('Phone Numbers:', json.dumps(data, indent=2))
        else:
            print('No content returned')

if __name__ == "__main__":
    asyncio.run(test_vapi())
