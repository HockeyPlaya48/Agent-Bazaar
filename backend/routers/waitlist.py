from fastapi import APIRouter
from models import WaitlistEntry
from config import supabase

router = APIRouter(prefix="/atlas", tags=["atlas"])


@router.post("/waitlist")
def join_waitlist(entry: WaitlistEntry):
    response = (
        supabase.table("atlas_waitlist")
        .insert({"email": entry.email, "goals": entry.goals})
        .execute()
    )
    return {"message": "Successfully joined the waitlist", "data": response.data}
