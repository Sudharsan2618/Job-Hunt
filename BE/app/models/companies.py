"""
Companies Document Model
Follows MongoDB schema from DB/Mongo.txt
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class CompanyDetailsModel(BaseModel):
    description: Optional[str] = None
    website: Optional[str] = None
    industries: List[str] = Field(default_factory=list)
    staffCount: Optional[int] = None
    staffingCompany: Optional[bool] = None


class CompaniesModel(BaseModel):
    """MongoDB document model for companies collection"""
    id: Optional[str] = Field(None, alias="_id")
    companyName: str
    companyDomain: str
    linkedinSlug: Optional[str] = None
    companyDetails: Optional[CompanyDetailsModel] = None
    industry: Optional[str] = None
    companyIndustry: Optional[str] = None  # primary industry as classified by LLM
    matchedIndustry: Optional[str] = None  # which target industry (display name) it matched
    targeted: Optional[bool] = None
    staffCount: Optional[int] = 0
    website: Optional[str] = None
    employeeCount: Optional[int] = 0
    location: Optional[str] = None
    isEligible: Optional[bool] = None
    notes: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
