import httpx
import json
import asyncio

async def test_vapi():
    headers = {
        'Authorization': 'Bearer b53d60fd-f374-4af6-b586-3d2ff3463efa',
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
