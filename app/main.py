import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import pyttsx3
from openai import OpenAI
import cognee

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(title="EyeSpeak AI", version="1.0.0")

# Import caregiver router
from app.caregiver import router as caregiver_router
app.include_router(caregiver_router)

# Import orchestration router
from app.orchestrate import router as orchestrate_router
app.include_router(orchestrate_router)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Nebius client for AI
nebius_client = OpenAI(
    base_url="https://api.tokenfactory.us-central1.nebius.com/v1/",
    api_key=os.environ.get("NEBIUS_API_KEY")
)

# Initialize Cognee
cognee.config.set_base_url(os.environ.get("COGNEE_BASE_URL"))
cognee.config.set_api_key(os.environ.get("COGNEE_API_KEY"))

# Initialize text-to-speech engine
tts_engine = pyttsx3.init()

# In-memory history storage (replace with database in production)
interaction_history = []


# Pydantic models
class CategoryRequest(BaseModel):
    category: str
    context: Optional[str] = None


class CategoryResponse(BaseModel):
    category: str
    suggestions: List[str]


class SpeakRequest(BaseModel):
    text: str


class SaveRequest(BaseModel):
    category: str
    phrase: str
    timestamp: Optional[str] = None


class HistoryItem(BaseModel):
    id: int
    category: str
    phrase: str
    timestamp: str


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "app": "EyeSpeak AI",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "category": "POST /category",
            "speak": "POST /speak",
            "save": "POST /save",
            "history": "GET /history",
            "caregiver": "GET /caregiver-assistant",
            "caregiver_search": "POST /caregiver/search",
            "orchestrate_call": "POST /orchestrate/call",
            "orchestrate_health": "GET /orchestrate/health"
        }
    }


@app.get("/caregiver-assistant", response_class=HTMLResponse)
async def caregiver_assistant():
    """Serve the caregiver assistant page"""
    with open("static/caregiver.html", "r") as f:
        return f.read()


@app.post("/category", response_model=CategoryResponse)
async def get_category_suggestions(request: CategoryRequest):
    """
    Generate AI-powered phrase suggestions based on the selected category.

    Example categories: Water, Food, Help, Pain, Bathroom, etc.
    """
    try:
        # Get personalized suggestions from Cognee memory first
        personalized_suggestions = []
        try:
            memory_results = await cognee.search(f"category:{request.category}")
            if memory_results:
                personalized_suggestions = [
                    result.get("phrase", "") for result in memory_results[:2]
                    if result.get("phrase")
                ]
        except Exception as e:
            print(f"Cognee search error: {e}")

        # Generate AI suggestions using Nebius
        system_prompt = f"""You are a helpful assistant for a communication app for stroke patients.
The patient has selected the category: {request.category}

Generate 3 natural, conversational phrases that the patient might want to say.
Make them simple, direct, and practical.
Each phrase should be on a new line."""

        user_message = f"Generate 3 phrases for category: {request.category}"
        if request.context:
            user_message += f"\nAdditional context: {request.context}"

        response = nebius_client.chat.completions.create(
            model="MiniMaxAI/MiniMax-M3",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=200
        )

        # Parse AI response
        ai_text = response.choices[0].message.content.strip()
        ai_suggestions = [
            line.strip().lstrip("123456789.-) ").strip()
            for line in ai_text.split("\n")
            if line.strip()
        ][:3]

        # Combine personalized and AI suggestions
        all_suggestions = personalized_suggestions + ai_suggestions

        # Return top 3 unique suggestions
        unique_suggestions = []
        for s in all_suggestions:
            if s and s not in unique_suggestions:
                unique_suggestions.append(s)

        return CategoryResponse(
            category=request.category,
            suggestions=unique_suggestions[:3]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating suggestions: {str(e)}")


@app.post("/speak")
async def speak_text(request: SpeakRequest):
    """
    Convert text to speech and play it aloud.
    """
    try:
        # Use text-to-speech
        tts_engine.say(request.text)
        tts_engine.runAndWait()

        return {
            "success": True,
            "message": "Text spoken successfully",
            "text": request.text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error speaking text: {str(e)}")


@app.post("/save")
async def save_interaction(request: SaveRequest):
    """
    Save interaction to memory (Cognee) and local history.
    """
    try:
        timestamp = request.timestamp or datetime.now().isoformat()

        # Save to Cognee for personalized learning
        memory_text = f"category:{request.category} phrase:{request.phrase} timestamp:{timestamp}"
        try:
            await cognee.add(memory_text)
            await cognee.cognify()
        except Exception as e:
            print(f"Cognee save error: {e}")

        # Save to local history
        history_item = {
            "id": len(interaction_history) + 1,
            "category": request.category,
            "phrase": request.phrase,
            "timestamp": timestamp
        }
        interaction_history.append(history_item)

        return {
            "success": True,
            "message": "Interaction saved successfully",
            "id": history_item["id"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving interaction: {str(e)}")


@app.get("/history", response_model=List[HistoryItem])
async def get_history(limit: int = 50):
    """
    Retrieve interaction history.
    """
    try:
        # Return most recent interactions first
        recent_history = interaction_history[-limit:][::-1]
        return recent_history

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
