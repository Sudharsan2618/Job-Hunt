"""
ICP Config Pydantic Schemas for API Request/Response
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class TitleConfigSchema(BaseModel):
    title: str
    isActive: bool
    isDefault: bool


class LocationConfigSchema(BaseModel):
    location: str
    country: str
    isActive: bool
    isDefault: bool


class IndustryConfigSchema(BaseModel):
    slug: str
    displayName: str
    isTarget: bool
    linkedinNames: List[str] = Field(default_factory=list)
    description: Optional[str] = None


class AddIndustryRequest(BaseModel):
    displayName: str
    description: Optional[str] = None


class AddTitleRequest(BaseModel):
    title: str


class AddLocationRequest(BaseModel):
    location: str
    country: Optional[str] = ""


class PersonaMappingSchema(BaseModel):
    industrySlug: str
    personaTitles: List[str]


class ICPConfigResponseSchema(BaseModel):
    id: Optional[str] = None
    version: int
    isActive: bool
    titles: List[TitleConfigSchema]
    locations: List[LocationConfigSchema]
    industries: List[IndustryConfigSchema]
    personaMappings: List[PersonaMappingSchema]
    defaultPersonaTitles: List[str]
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
