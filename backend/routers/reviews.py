from fastapi import APIRouter, Query
from config import supabase

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("")
def list_reviews(agent_id: str = Query(..., description="Filter reviews by agent ID")):
    response = (
        supabase.table("reviews")
        .select("*")
        .eq("agent_id", agent_id)
        .order("date", desc=True)
        .execute()
    )
    return response.data
