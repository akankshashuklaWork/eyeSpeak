import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Optional, Dict

router = APIRouter(prefix="/orchestrate", tags=["orchestration"])

ORCHESTRATE_BASE_URL = os.environ.get("ORCHESTRATE_BASE_URL", "http://127.0.0.1:8010")


class OrchestrationRequest(BaseModel):
    """Request model for orchestration endpoint"""
    action: str
    data: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None


class OrchestrationResponse(BaseModel):
    """Response model from orchestration service"""
    success: bool
    result: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    error: Optional[str] = None


@router.post("/call", response_model=OrchestrationResponse)
async def call_orchestration(request: OrchestrationRequest):
    """
    Call the orchestration service endpoint.

    This endpoint forwards requests to the orchestration service
    running at ORCHESTRATE_BASE_URL/orchestrate

    Example:
        {
            "action": "process_request",
            "data": {"category": "Water", "phrase": "I need water"},
            "context": {"user_id": "123"}
        }
    """
    try:
        orchestrate_url = f"{ORCHESTRATE_BASE_URL}/orchestrate"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                orchestrate_url,
                json=request.model_dump()
            )

            # Check if request was successful
            response.raise_for_status()

            # Parse response
            data = response.json()

            return OrchestrationResponse(
                success=True,
                result=data,
                message="Orchestration request completed successfully"
            )

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Orchestration service error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to orchestration service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calling orchestration service: {str(e)}"
        )


@router.get("/health")
async def check_orchestration_health():
    """
    Check if the orchestration service is reachable.
    """
    try:
        orchestrate_url = f"{ORCHESTRATE_BASE_URL}/orchestrate"

        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(ORCHESTRATE_BASE_URL)

            return {
                "orchestration_service": "reachable",
                "base_url": ORCHESTRATE_BASE_URL,
                "status_code": response.status_code
            }

    except Exception as e:
        return {
            "orchestration_service": "unreachable",
            "base_url": ORCHESTRATE_BASE_URL,
            "error": str(e)
        }
