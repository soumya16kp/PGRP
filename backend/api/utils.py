import requests

def send_fast2sms_otp(phone, otp):
    url = "https://www.fast2sms.com/dev/bulkV2"
    
    api_key = "RY4h8fTIr5jBMAEwFOVmeLgy2S0uti1XQKpq6NxDnH73lZoGW9UStFJ3YfLNBv4RHIZbxXVPmcpo5QW2"

    headers = {
        'authorization': api_key,
        'Content-Type': "application/json"
    }

    # Try Route "v3" (Quick Send) instead of "otp"
    data = {
        "route": "v3",
        "sender_id": "TXTIND", 
        "message": f"Municipality Login Code: {otp}",
        "language": "english",
        "flash": 0,
        "numbers": phone,
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        print("Fast2SMS Response:", response.text)
        return response.json()
    except Exception as e:
        print("Fast2SMS Error:", str(e))
        return None