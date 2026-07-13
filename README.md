# 👁️ EyeSpeak AI

**Eye Gaze Communication System for Stroke & Paralysis Patients**

A FastAPI backend that enables patients to communicate using eye movements by combining:
- **Nebius AI** for intelligent phrase generation
- **Cognee** for personalized memory and learning
- **Nimble** for caregiver resource search
- **Text-to-Speech** for voice output

Built for the Bay Builders Hackathon.

---

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -e .
   ```

2. **Environment setup:**
   Your `.env` file is already configured with API keys.

3. **Run the server:**
   ```bash
   ./start.sh
   ```
   Or manually:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Access the application:**
   - API: http://localhost:8000
   - Caregiver Assistant: http://localhost:8000/caregiver-assistant
   - API Docs: http://localhost:8000/docs

---

## 📡 API Endpoints

### POST `/category`
Generate AI-powered phrase suggestions based on category selection.

**Request:**
```json
{
  "category": "Water",
  "context": "thirsty"
}
```

**Response:**
```json
{
  "category": "Water",
  "suggestions": [
    "I would like some water please",
    "Can I have a glass of water?",
    "I'm thirsty"
  ]
}
```

### POST `/speak`
Convert text to speech.

**Request:**
```json
{
  "text": "I would like some water please"
}
```

### POST `/save`
Save interaction to memory for personalization.

**Request:**
```json
{
  "category": "Water",
  "phrase": "I would like some water please"
}
```

### GET `/history`
Retrieve interaction history.

**Query Params:** `?limit=50`

### POST `/caregiver/search`
Search for caregiver resources using Nimble.

**Request:**
```json
{
  "query": "",
  "category": "rehabilitation",
  "location": "San Francisco"
}
```

Categories: `rehabilitation`, `therapy`, `exercises`, `healthcare`

### GET `/caregiver-assistant`
HTML page for caregiver resource search.

### POST `/orchestrate/call`
Call the orchestration service to coordinate actions across the system.

**Request:**
```json
{
  "action": "process_request",
  "data": {
    "category": "Water",
    "phrase": "I need water"
  },
  "context": {
    "user_id": "123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": { ... },
  "message": "Orchestration request completed successfully"
}
```

### GET `/orchestrate/health`
Check connectivity to the orchestration service.

**Response:**
```json
{
  "orchestration_service": "reachable",
  "base_url": "http://127.0.0.1:8010",
  "status_code": 200
}
```

---

## 🏗️ Deployment (InsForge)

### Using Docker

```bash
# Build the image
docker build -t eyespeak-ai .

# Run the container
docker run -p 8000:8000 --env-file .env eyespeak-ai
```

### Deploy to InsForge

This backend is ready to deploy on InsForge:

1. Initialize InsForge app:
   ```bash
   insforge init eyespeak-ai
   ```

2. Deploy the backend:
   ```bash
   insforge deploy
   ```

3. Set environment variables:
   ```bash
   insforge env:set NEBIUS_API_KEY=<your-key>
   insforge env:set COGNEE_BASE_URL=<your-url>
   insforge env:set COGNEE_API_KEY=<your-key>
   insforge env:set NIMBLE_API_KEY=<your-key>
   insforge env:set ORCHESTRATE_BASE_URL=<orchestration-service-url>
   ```

---

## 🏗️ Project Structure

```
.
├── app/
│   ├── __init__.py       # Package init
│   ├── main.py           # Main FastAPI application
│   ├── caregiver.py      # Caregiver assistant endpoints
│   └── orchestrate.py    # Orchestration service integration
├── static/
│   └── caregiver.html    # Caregiver assistant UI
├── pyproject.toml        # Project dependencies
├── Dockerfile            # Docker configuration
├── start.sh              # Startup script
├── .env                  # Environment variables (not in git)
├── .env.example          # Example environment file
└── README.md             # This file
```

---

## 🔧 Technology Stack

- **FastAPI** - Modern Python web framework
- **Nebius AI** - MiniMax-M3 model for phrase generation
- **Cognee** - Knowledge graph for personalized memory
- **Nimble** - Web search for caregiver resources
- **pyttsx3** - Text-to-speech synthesis
- **Uvicorn** - ASGI server

---

## 🤝 Integration with Frontend

The API is designed to work with any eye-tracking frontend:

1. Frontend tracks user's gaze on category cards
2. After dwell-time selection, call `POST /category`
3. Display the 3 suggested phrases
4. User selects phrase with gaze
5. Call `POST /speak` to vocalize
6. Call `POST /save` to remember for personalization

---

## 🩺 Caregiver Assistant

The caregiver assistant (`/caregiver-assistant`) provides:
- Search for stroke rehabilitation centers
- Find speech therapy services
- Locate stroke recovery exercises
- Discover home healthcare options

All powered by Nimble's web search API.

---

## 🔐 Security

- All API keys are stored in `.env` (not committed to git)
- CORS enabled for frontend integration
- Environment-based configuration

---

## 📝 Hackathon Sponsors Used

✅ **Nebius** - AI model inference (MiniMax-M3)
✅ **Cognee** - Personalized memory & learning
✅ **Nimble** - Caregiver information search
✅ **InsForge** - Backend deployment platform

---

## 🎯 MVP Demo Flow

1. Patient gazes at 💧 Water category
2. Eye tracking selects after 2-second dwell
3. Backend generates 3 natural phrases via Nebius
4. Patient selects phrase with gaze
5. App speaks sentence aloud via TTS
6. Cognee saves interaction for future personalization
7. (Optional) Caregiver uses Nimble assistant for resources

---

## 👨‍💻 Development

**Run tests:**
```bash
pytest
```

**Format code:**
```bash
black app/
```

**Type checking:**
```bash
mypy app/
```

---

## 📄 License

MIT License - Built for Bay Builders Hackathon 2026
