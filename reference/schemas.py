"""
HR Assistant Pydantic Schemas for API Request/Response
Ported from Job-Hunt/BE/app/schemas/
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── ICP Config Schemas ─────────────────────────────────────────────────

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
    linkedinNames: List[str]


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


# ── Run Schemas ────────────────────────────────────────────────────────

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
    targetIndustries: List[str] = Field(
        ...,  # Required field
        min_length=1,
        description="Industry slugs selected for this run (e.g., ['government', 'healthcare'])"
    )
    hoursOld: int
    resultsPerSearch: int
    siteName: List[str]
    icpConfigSnapshot: Optional[ICPConfigSnapshotSchema] = None



class RunCreateSchema(BaseModel):
    title: str
    source: str = "jobspy"
    runConfig: RunConfigSchema
    owners: Optional[List[str]] = None


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


# ── Prospect Search Schemas ────────────────────────────────────────────

class ProspectSearchRequestSchema(BaseModel):
    """Request body for on-demand prospect search APIs."""
    runId: str = Field(..., description="Run ID to associate prospects with")
    companyIds: List[str] = Field(..., min_length=1, description="List of company ObjectId strings")


class ProspectCompanyResultSchema(BaseModel):
    """Per-company result from a prospect search."""
    companyId: str
    companyName: str = ""
    domain: str = ""
    strategy: Optional[str] = None
    accepted: int = 0
    rejected: int = 0
    skipped: bool = False
    skipReason: Optional[str] = None


class ProspectSearchResponseSchema(BaseModel):
    """Response from prospect search APIs."""
    status: str
    message: str
    totalAccepted: int = 0
    totalRejected: int = 0
    companiesProcessed: int = 0
    companiesSkipped: int = 0
    results: List[ProspectCompanyResultSchema] = []

