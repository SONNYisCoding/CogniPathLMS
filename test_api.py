import requests
import json

url = "http://localhost:5000/api/generate-path"
headers = {"Content-Type": "application/json"}
data = {
    "name": "Test User",
    "goal": "Learn Python",
    "level": "Beginner"
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
