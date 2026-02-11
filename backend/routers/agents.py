from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from config import supabase

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("")
def list_agents(
    category: Optional[str] = Query(None, description="Filter by category"),
    sort: Optional[str] = Query(None, description="Sort: popular, highest-rated, price-low, price-high"),
    search: Optional[str] = Query(None, description="Search by name or tags"),
):
    query = supabase.table("agent_listings").select("*")

    if category:
        query = query.eq("category", category)

    if search:
        # Search in name and tags using ilike for name, contains for tags
        query = query.or_(f"name.ilike.%{search}%,tags.cs.{{{search}}}")

    if sort == "popular":
        query = query.order("sales_count", desc=True)
    elif sort == "highest-rated":
        query = query.order("rating", desc=True)
    elif sort == "price-low":
        query = query.order("price", desc=False)
    elif sort == "price-high":
        query = query.order("price", desc=True)
    else:
        query = query.order("sales_count", desc=True)

    response = query.execute()
    return response.data


@router.get("/{slug}")
def get_agent(slug: str):
    response = (
        supabase.table("agent_listings")
        .select("*")
        .eq("slug", slug)
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    return response.data
