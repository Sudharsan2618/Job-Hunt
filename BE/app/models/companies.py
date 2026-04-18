"""
Companies Document Model
Follows MongoDB schema from DB/Mongo.txt
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId


class CompanyDetailsModel(BaseModel):
    description: Optional[str] = None
    website: Optional[str] = None


class CompaniesModel(BaseModel):
    """MongoDB document model for companies collection"""
    id: Optional[str] = Field(None, alias="_id")
    companyName: str
    companyDomain: str
    companyDetails: Optional[CompanyDetailsModel] = None
    industry: Optional[str] = None
    employeeCount: Optional[int] = 0
    location: Optional[str] = None
    isEligible: Optional[bool] = None
    notes: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str
        }
