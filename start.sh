#!/bin/bash

# EyeSpeak AI - Startup Script

echo "🚀 Starting EyeSpeak AI..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with your API keys"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install -e .

# Create __init__.py if it doesn't exist
touch app/__init__.py

# Start the server
echo "✅ Starting server on http://localhost:8000"
echo ""
echo "📋 Available endpoints:"
echo "  - GET  /                    (API info)"
echo "  - POST /category            (Get AI phrase suggestions)"
echo "  - POST /speak               (Text-to-speech)"
echo "  - POST /save                (Save interaction to memory)"
echo "  - GET  /history             (Get interaction history)"
echo "  - GET  /caregiver-assistant (Caregiver resources page)"
echo "  - POST /caregiver/search    (Search caregiver resources)"
echo ""
echo "🩺 Caregiver Assistant: http://localhost:8000/caregiver-assistant"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
