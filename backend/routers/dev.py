import re
from fastapi import APIRouter, Query
from models import AgentCreate
from config import supabase

router = APIRouter(prefix="/dev", tags=["developer"])


def slugify(name: str) -> str:
    """Convert a name to a URL-friendly slug."""
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug


@router.get("/stats")
def get_developer_stats(developer_name: str = Query(..., description="Developer name")):
    # Get all agents by this developer
    response = (
        supabase.table("agent_listings")
        .select("price, sales_count, rating, review_count")
        .eq("developer_name", developer_name)
        .execute()
    )

    agents = response.data
    if not agents:
        return {
            "developer_name": developer_name,
            "total_revenue": 0,
            "total_sales": 0,
            "avg_rating": 0,
            "agent_count": 0,
        }

    total_revenue = sum(a["price"] * a["sales_count"] for a in agents)
    total_sales = sum(a["sales_count"] for a in agents)
    total_reviews = sum(a["review_count"] for a in agents)
    weighted_rating = (
        sum(a["rating"] * a["review_count"] for a in agents) / total_reviews
        if total_reviews > 0
        else 0
    )

    return {
        "developer_name": developer_name,
        "total_revenue": round(total_revenue, 2),
        "total_sales": total_sales,
        "avg_rating": round(weighted_rating, 2),
        "agent_count": len(agents),
    }


@router.get("/agents")
def get_developer_agents(developer_name: str = Query(..., description="Developer name")):
    response = (
        supabase.table("agent_listings")
        .select("*")
        .eq("developer_name", developer_name)
        .order("sales_count", desc=True)
        .execute()
    )
    return response.data


@router.post("/agents")
def submit_agent(agent: AgentCreate):
    slug = slugify(agent.name)

    new_agent = {
        "name": agent.name,
        "slug": slug,
        "description": agent.description,
        "long_description": "",
        "category": agent.category.value,
        "price": agent.price,
        "price_type": agent.price_type.value,
        "original_price": agent.price,
        "icon": "🤖",
        "screenshots": [],
        "demo_url": agent.demo_url,
        "install_type": agent.install_type.value,
        "atlas_compatible": agent.atlas_compatible,
        "developer_name": "",
        "rating": 0,
        "review_count": 0,
        "sales_count": 0,
        "featured": False,
        "tags": [],
    }

    response = supabase.table("agent_listings").insert(new_agent).execute()
    return {"message": "Agent submitted for review", "agent": response.data}
