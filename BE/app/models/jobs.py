"""
Jobs Document Model
Follows MongoDB schema from DB/Mongo.txt
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId


class JobDetailsModel(BaseModel):
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    salary: Optional[Dict[str, Any]] = None


class JobsModel(BaseModel):
    """MongoDB document model for jobs collection"""
    id: Optional[str] = Field(None, alias="_id")
    runId: Optional[str] = None
    title: str
    location: str
    boardName: Optional[str] = None
    externalId: Optional[str] = None
    companyId: Optional[str] = None
    jobDetails: Optional[JobDetailsModel] = None
    qualityStatus: Optional[str] = "good"
    rejectionReason: Optional[str] = None
    canonicalId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str
        }
