"""
ICP Config Document Model
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


class TitleConfigModel(BaseModel):
    title: str
    isActive: bool
    isDefault: bool


class LocationConfigModel(BaseModel):
    location: str
    country: str
    isActive: bool
    isDefault: bool


class IndustryConfigModel(BaseModel):
    slug: str
    displayName: str
    isTarget: bool
    linkedinNames: List[str]


class PersonaMappingModel(BaseModel):
    industrySlug: str
    personaTitles: List[str]


class ICPConfigModel(BaseModel):
    """MongoDB document model for icpConfig collection"""
    id: Optional[str] = Field(None, alias="_id")
    version: int
    isActive: bool
    titles: List[TitleConfigModel]
    locations: List[LocationConfigModel]
    industries: List[IndustryConfigModel]
    personaMappings: List[PersonaMappingModel]
    defaultPersonaTitles: List[str]
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str
        }
