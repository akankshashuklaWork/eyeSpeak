"""
EyeSpeak AI - API Testing Script

Run this to test all API endpoints locally.
Make sure the server is running: ./start.sh
"""

import requests
import json

BASE_URL = "http://localhost:8000"


def test_root():
    """Test health check endpoint"""
    print("🔍 Testing GET /")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_category():
    """Test category suggestions endpoint"""
    print("🔍 Testing POST /category")
    payload = {
        "category": "Water",
        "context": "thirsty"
    }
    response = requests.post(f"{BASE_URL}/category", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Request: {json.dumps(payload, indent=2)}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_save():
    """Test save interaction endpoint"""
    print("🔍 Testing POST /save")
    payload = {
        "category": "Water",
        "phrase": "I would like some water please"
    }
    response = requests.post(f"{BASE_URL}/save", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Request: {json.dumps(payload, indent=2)}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_speak():
    """Test text-to-speech endpoint"""
    print("🔍 Testing POST /speak")
    payload = {
        "text": "I would like some water please"
    }
    response = requests.post(f"{BASE_URL}/speak", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Request: {json.dumps(payload, indent=2)}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_history():
    """Test history endpoint"""
    print("🔍 Testing GET /history")
    response = requests.get(f"{BASE_URL}/history?limit=10")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_caregiver_search():
    """Test caregiver search endpoint"""
    print("🔍 Testing POST /caregiver/search")
    payload = {
        "query": "",
        "category": "rehabilitation",
        "location": "San Francisco"
    }
    response = requests.post(f"{BASE_URL}/caregiver/search", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Request: {json.dumps(payload, indent=2)}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


if __name__ == "__main__":
    print("=" * 60)
    print("EyeSpeak AI - API Testing")
    print("=" * 60)
    print()

    try:
        test_root()
        test_category()
        test_save()
        test_speak()
        test_history()
        test_caregiver_search()

        print("✅ All tests completed!")
        print()
        print("🩺 Visit the Caregiver Assistant:")
        print(f"   {BASE_URL}/caregiver-assistant")
        print()
        print("📖 View API Docs:")
        print(f"   {BASE_URL}/docs")

    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to server")
        print("Make sure the server is running: ./start.sh")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
