"""
Prospects Document Model
Follows MongoDB schema from DB/Mongo.txt
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId


class ProspectDetailsModel(BaseModel):
    linkedinUrl: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None


class ProspectsModel(BaseModel):
    """MongoDB document model for prospects collection"""
    id: Optional[str] = Field(None, alias="_id")
    companyId: Optional[str] = None
    firstName: str
    lastName: str
    email: str
    title: Optional[str] = None
    prospectDetails: Optional[ProspectDetailsModel] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str
        }
