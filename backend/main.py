from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import API_PREFIX
from routers import agents, bundles, reviews, purchases, dev, waitlist, health

app = FastAPI(title="Agent Bazaar API", version="1.0.0")

# CORS middleware — allow all origins for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=API_PREFIX)
app.include_router(agents.router, prefix=API_PREFIX)
app.include_router(bundles.router, prefix=API_PREFIX)
app.include_router(reviews.router, prefix=API_PREFIX)
app.include_router(purchases.router, prefix=API_PREFIX)
app.include_router(dev.router, prefix=API_PREFIX)
app.include_router(waitlist.router, prefix=API_PREFIX)


@app.get("/")
def root():
    return {"message": "Agent Bazaar API", "version": "1.0.0"}
