from fastapi import APIRouter, HTTPException
from config import supabase

router = APIRouter(prefix="/bundles", tags=["bundles"])


@router.get("")
def list_bundles():
    # Get all bundles
    bundles_response = supabase.table("bundles").select("*").execute()
    bundles = bundles_response.data

    # For each bundle, get its agents via the junction table
    for bundle in bundles:
        junction_response = (
            supabase.table("bundle_agents")
            .select("agent_id")
            .eq("bundle_id", bundle["id"])
            .execute()
        )
        agent_ids = [row["agent_id"] for row in junction_response.data]

        if agent_ids:
            agents_response = (
                supabase.table("agent_listings")
                .select("*")
                .in_("id", agent_ids)
                .execute()
            )
            bundle["agents"] = agents_response.data
        else:
            bundle["agents"] = []

    return bundles


@router.get("/{slug}")
def get_bundle(slug: str):
    response = (
        supabase.table("bundles")
        .select("*")
        .eq("slug", slug)
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Bundle not found")

    bundle = response.data

    # Get agents for this bundle
    junction_response = (
        supabase.table("bundle_agents")
        .select("agent_id")
        .eq("bundle_id", bundle["id"])
        .execute()
    )
    agent_ids = [row["agent_id"] for row in junction_response.data]

    if agent_ids:
        agents_response = (
            supabase.table("agent_listings")
            .select("*")
            .in_("id", agent_ids)
            .execute()
        )
        bundle["agents"] = agents_response.data
    else:
        bundle["agents"] = []

    return bundle
