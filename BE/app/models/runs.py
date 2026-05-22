"""
Runs Document Model
Follows MongoDB schema from DB/Mongo.txt
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId


class RunStatsModel(BaseModel):
    """Live counters updated as data flows in during the run"""
    totalJobsScraped: int = 0
    uniqueCompanies: int = 0
    acceptedCompanies: int = 0
    rejectedCompanies: int = 0
    totalProspects: int = 0


class ICPConfigSnapshotModel(BaseModel):
    """Reference to the icpConfig version used"""
    icpConfigId: Optional[str] = None
    version: int


class RunConfigModel(BaseModel):
    """Snapshot of the ICP config used for this run"""
    searchTitles: List[str]
    searchLocations: List[str]
    targetIndustries: List[str] = Field(default_factory=list)
    customIndustries: List[str] = Field(default_factory=list)
    hoursOld: int
    resultsPerSearch: int
    siteName: List[str]
    icpConfigSnapshot: Optional[ICPConfigSnapshotModel] = None

    # Naukri & Rejection Filter configurations
    searchUrl: Optional[str] = None
    scrapeDescriptions: Optional[bool] = True
    maxDescriptions: Optional[int] = 10
    minExperience: Optional[int] = None
    maxExperience: Optional[int] = None


class RunsModel(BaseModel):
    """MongoDB document model for runs collection"""
    id: Optional[str] = Field(None, alias="_id")
    title: str
    source: str = "jobspy"
    runStartedAt: datetime
    runEndedAt: Optional[datetime] = None
    status: str = "active"
    stats: RunStatsModel = Field(default_factory=RunStatsModel)
    runConfig: RunConfigModel
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str
        }
