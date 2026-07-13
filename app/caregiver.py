import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/caregiver", tags=["caregiver"])

NIMBLE_API_KEY = os.environ.get("NIMBLE_API_KEY")
NIMBLE_BASE_URL = "https://api.nimble.com/api/v1"  # Update with actual Nimble API endpoint


class SearchRequest(BaseModel):
    query: str
    category: str  # "rehabilitation", "therapy", "exercises", "healthcare"
    location: Optional[str] = None


class SearchResult(BaseModel):
    title: str
    description: str
    url: Optional[str] = None
    contact: Optional[str] = None
    address: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    category: str
    results: List[SearchResult]


@router.post("/search", response_model=SearchResponse)
async def search_resources(request: SearchRequest):
    """
    Search for caregiver resources using Nimble API.

    Categories:
    - rehabilitation: Stroke rehabilitation centers
    - therapy: Speech therapy services
    - exercises: Stroke recovery exercises
    - healthcare: Home healthcare services
    """
    try:
        # Construct search query based on category
        category_keywords = {
            "rehabilitation": "stroke rehabilitation center",
            "therapy": "speech therapy",
            "exercises": "stroke recovery exercises",
            "healthcare": "home healthcare services"
        }

        search_term = f"{category_keywords.get(request.category, request.query)} {request.query}"
        if request.location:
            search_term += f" {request.location}"

        # Call Nimble API for web search/scraping
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {NIMBLE_API_KEY}",
                "Content-Type": "application/json"
            }

            # Example Nimble API call structure (adjust based on actual Nimble API docs)
            payload = {
                "query": search_term,
                "type": "web_search",
                "limit": 10
            }

            # Mock response for development (replace with actual API call)
            # response = await client.post(
            #     f"{NIMBLE_BASE_URL}/search",
            #     headers=headers,
            #     json=payload
            # )
            # data = response.json()

            # Mock data for demo purposes
            mock_results = generate_mock_results(request.category, request.location)

            return SearchResponse(
                query=request.query,
                category=request.category,
                results=mock_results
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching resources: {str(e)}"
        )


def generate_mock_results(category: str, location: Optional[str] = None) -> List[SearchResult]:
    """Generate mock results for demo (replace with real Nimble API integration)"""

    location_str = location or "your area"

    results_map = {
        "rehabilitation": [
            SearchResult(
                title=f"Comprehensive Stroke Rehabilitation Center - {location_str}",
                description="Full-service rehabilitation center specializing in stroke recovery with PT, OT, and speech therapy.",
                url="https://example.com/rehab1",
                contact="(555) 123-4567",
                address=f"123 Health St, {location_str}"
            ),
            SearchResult(
                title="Advanced Neurological Rehabilitation Institute",
                description="State-of-the-art facility for stroke and brain injury rehabilitation.",
                url="https://example.com/rehab2",
                contact="(555) 234-5678",
                address=f"456 Recovery Ave, {location_str}"
            ),
        ],
        "therapy": [
            SearchResult(
                title="Speech & Language Therapy Specialists",
                description="Dedicated speech therapy for stroke survivors and communication disorders.",
                url="https://example.com/speech1",
                contact="(555) 345-6789",
                address=f"789 Voice Ln, {location_str}"
            ),
            SearchResult(
                title="CommuniCare Speech Therapy",
                description="In-home and clinic-based speech therapy services.",
                url="https://example.com/speech2",
                contact="(555) 456-7890",
                address=f"321 Talk Way, {location_str}"
            ),
        ],
        "exercises": [
            SearchResult(
                title="Stroke Recovery Exercise Program - Free Guide",
                description="Comprehensive guide to exercises for stroke rehabilitation at home.",
                url="https://example.com/exercises1",
                contact=None,
                address=None
            ),
            SearchResult(
                title="Physical Therapy Videos for Stroke Survivors",
                description="Step-by-step video exercises designed by licensed physical therapists.",
                url="https://example.com/exercises2",
                contact=None,
                address=None
            ),
        ],
        "healthcare": [
            SearchResult(
                title=f"Home Healthcare Services - {location_str}",
                description="Professional in-home care for stroke survivors including nursing and therapy.",
                url="https://example.com/home1",
                contact="(555) 567-8901",
                address=f"Service area: {location_str}"
            ),
            SearchResult(
                title="24/7 Home Care Professionals",
                description="Round-the-clock care and support for stroke patients at home.",
                url="https://example.com/home2",
                contact="(555) 678-9012",
                address=f"Serving {location_str}"
            ),
        ],
    }

    return results_map.get(category, [
        SearchResult(
            title="Resource Information",
            description="Please specify a valid category: rehabilitation, therapy, exercises, or healthcare.",
            url=None,
            contact=None,
            address=None
        )
    ])
