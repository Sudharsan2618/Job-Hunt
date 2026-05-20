"""
Runs Pydantic Schemas for API Request/Response
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RunStatsSchema(BaseModel):
    totalJobsScraped: int = 0
    uniqueCompanies: int = 0
    acceptedCompanies: int = 0
    rejectedCompanies: int = 0
    totalProspects: int = 0


class ICPConfigSnapshotSchema(BaseModel):
    icpConfigId: Optional[str] = None
    version: int


class RunConfigSchema(BaseModel):
    searchTitles: List[str]
    searchLocations: List[str]
    hoursOld: int
    resultsPerSearch: int
    siteName: List[str]
    icpConfigSnapshot: Optional[ICPConfigSnapshotSchema] = None
    
    # Naukri & Rejection Filter configurations
    searchUrl: Optional[str] = None
    scrapeDescriptions: Optional[bool] = True
    maxDescriptions: Optional[int] = 10
    minExperience: Optional[int] = None
    maxExperience: Optional[int] = None


class RunCreateSchema(BaseModel):
    title: str
    source: str = "jobspy"
    runConfig: RunConfigSchema


class RunStatsFullSchema(RunStatsSchema):
    """Extended stats with fields written by the orchestrator."""
    inserted: int = 0
    duplicates: int = 0
    acceptedJobs: int = 0
    rejectedJobs: int = 0
    skippedCompanies: int = 0


class RunResponseSchema(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    source: str
    status: str
    runStartedAt: datetime
    runEndedAt: Optional[datetime] = None
    stats: RunStatsFullSchema = RunStatsFullSchema()
    runConfig: RunConfigSchema
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    model_config = {"populate_by_name": True}
