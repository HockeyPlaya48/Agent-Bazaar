from fastapi import APIRouter, HTTPException, Query
from models import Purchase
from config import supabase

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.post("/agent")
def purchase_agent(purchase: Purchase):
    if not purchase.agent_id:
        raise HTTPException(status_code=400, detail="agent_id is required")

    # Verify agent exists
    agent_response = (
        supabase.table("agent_listings")
        .select("id, sales_count")
        .eq("id", purchase.agent_id)
        .single()
        .execute()
    )
    if not agent_response.data:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Save purchase
    purchase_response = (
        supabase.table("purchases")
        .insert({"agent_id": purchase.agent_id, "type": "agent"})
        .execute()
    )

    # Increment sales_count
    new_count = agent_response.data["sales_count"] + 1
    supabase.table("agent_listings").update({"sales_count": new_count}).eq(
        "id", purchase.agent_id
    ).execute()

    return {"message": "Purchase successful", "purchase": purchase_response.data}


@router.post("/bundle")
def purchase_bundle(purchase: Purchase):
    if not purchase.bundle_id:
        raise HTTPException(status_code=400, detail="bundle_id is required")

    # Verify bundle exists
    bundle_response = (
        supabase.table("bundles")
        .select("id")
        .eq("id", purchase.bundle_id)
        .single()
        .execute()
    )
    if not bundle_response.data:
        raise HTTPException(status_code=404, detail="Bundle not found")

    # Get agents in bundle
    junction_response = (
        supabase.table("bundle_agents")
        .select("agent_id")
        .eq("bundle_id", purchase.bundle_id)
        .execute()
    )
    agent_ids = [row["agent_id"] for row in junction_response.data]

    # Save purchase
    purchase_response = (
        supabase.table("purchases")
        .insert({"bundle_id": purchase.bundle_id, "type": "bundle"})
        .execute()
    )

    # Increment sales_count for each agent in the bundle
    for agent_id in agent_ids:
        agent = (
            supabase.table("agent_listings")
            .select("sales_count")
            .eq("id", agent_id)
            .single()
            .execute()
        )
        if agent.data:
            new_count = agent.data["sales_count"] + 1
            supabase.table("agent_listings").update({"sales_count": new_count}).eq(
                "id", agent_id
            ).execute()

    return {"message": "Bundle purchase successful", "purchase": purchase_response.data}


@router.get("")
def get_purchases(user_id: str = Query(..., description="User ID")):
    response = (
        supabase.table("purchases")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@router.get("/agents")
def get_purchased_agents(user_id: str = Query(..., description="User ID")):
    # Get all purchases for user
    purchases_response = (
        supabase.table("purchases")
        .select("agent_id, bundle_id, type")
        .eq("user_id", user_id)
        .execute()
    )

    agent_ids = set()
    for p in purchases_response.data:
        if p["type"] == "agent" and p.get("agent_id"):
            agent_ids.add(p["agent_id"])
        elif p["type"] == "bundle" and p.get("bundle_id"):
            # Get agents from bundle
            junction = (
                supabase.table("bundle_agents")
                .select("agent_id")
                .eq("bundle_id", p["bundle_id"])
                .execute()
            )
            for row in junction.data:
                agent_ids.add(row["agent_id"])

    if not agent_ids:
        return []

    agents_response = (
        supabase.table("agent_listings")
        .select("*")
        .in_("id", list(agent_ids))
        .execute()
    )
    return agents_response.data
