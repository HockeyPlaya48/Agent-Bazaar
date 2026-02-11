from pydantic import BaseModel
from typing import Optional
from enum import Enum


class Category(str, Enum):
    productivity = "productivity"
    marketing = "marketing"
    personal = "personal"
    ecommerce = "ecommerce"
    dev_tools = "dev-tools"
    finance = "finance"


class PriceType(str, Enum):
    lifetime = "lifetime"
    monthly = "monthly"
    free = "free"


class InstallType(str, Enum):
    api = "api"
    telegram = "telegram"
    zapier = "zapier"
    nocode = "nocode"
    custom = "custom"


class AgentListing(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    long_description: str
    category: Category
    price: float
    price_type: PriceType
    original_price: float
    icon: str
    screenshots: list[str] = []
    demo_url: str
    install_type: InstallType
    atlas_compatible: bool
    developer_name: str
    rating: float
    review_count: int
    sales_count: int
    featured: bool
    tags: list[str] = []


class AgentCreate(BaseModel):
    name: str
    category: Category
    description: str
    price: float
    price_type: PriceType
    demo_url: str = ""
    install_type: InstallType = InstallType.api
    atlas_compatible: bool = False


class Bundle(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    agent_ids: list[str]
    price: float
    original_price: float
    category: str
    atlas_hint: str
    featured: bool


class BundleWithAgents(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    agents: list[AgentListing]
    price: float
    original_price: float
    category: str
    atlas_hint: str
    featured: bool


class Review(BaseModel):
    id: str
    agent_id: str
    user_name: str
    rating: float
    comment: str
    date: str


class Purchase(BaseModel):
    agent_id: Optional[str] = None
    bundle_id: Optional[str] = None


class WaitlistEntry(BaseModel):
    email: str
    goals: list[str] = []
