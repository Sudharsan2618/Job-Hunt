"""
Runs API Endpoints
POST /api/v1/runs/start - Start a new recruitment run (background task)
GET  /api/v1/runs        - List all runs (paginated)
GET  /api/v1/runs/{id}   - Get run details
GET  /api/v1/runs/{id}/jobs - Get jobs for a run (paginated)
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, Query
from app.database import get_database
from app.schemas.runs import RunCreateSchema, RunResponseSchema
from app.services.orchestrator import process_run_background
from datetime import datetime, timedelta, timezone
from bson import ObjectId

router = APIRouter()


async def get_db():
    return await get_database()


# ── POST /start ─────────────────────────────────────────────────────────

@router.post("/start", response_model=RunResponseSchema)
async def start_run(
    request: RunCreateSchema,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
):
    try:
        if not request.runConfig.targetIndustries:
            raise HTTPException(status_code=400, detail="targetIndustries must contain at least one industry")
        runs_col = db["runs"]
        run_doc = {
            "title": request.title,
            "source": request.source,
            "runStartedAt": datetime.utcnow(),
            "status": "active",
            "stats": {
                "totalJobsScraped": 0,
                "uniqueCompanies": 0,
                "acceptedCompanies": 0,
                "rejectedCompanies": 0,
                "totalProspects": 0,
            },
            "runConfig": request.runConfig.model_dump(),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        result = await runs_col.insert_one(run_doc)
        run_id = str(result.inserted_id)

        background_tasks.add_task(
            process_run_background,
            run_id=run_id,
            run_config=request.runConfig.model_dump(),
        )

        run_doc["_id"] = run_id
        return RunResponseSchema(**run_doc)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting run: {str(e)}")


# ── GET / (list, paginated) ─────────────────────────────────────────────

@router.get("", response_model=list[RunResponseSchema])
async def list_runs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db=Depends(get_db),
):
    try:
        runs_col = db["runs"]
        skip = (page - 1) * limit
        cursor = runs_col.find().sort("createdAt", -1).skip(skip).limit(limit)
        runs = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            runs.append(RunResponseSchema(**doc))
        return runs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing runs: {str(e)}")


# ── GET /{run_id} ────────────────────────────────────────────────────────

@router.get("/{run_id}", response_model=RunResponseSchema)
async def get_run(run_id: str, db=Depends(get_db)):
    try:
        runs_col = db["runs"]
        doc = await runs_col.find_one({"_id": ObjectId(run_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Run not found")
        doc["_id"] = str(doc["_id"])
        return RunResponseSchema(**doc)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching run: {str(e)}")


# ── GET /{run_id}/jobs ───────────────────────────────────────────────────

@router.get("/{run_id}/jobs")
async def get_run_jobs(
    run_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    quality: str = Query(None, description="Filter by qualityStatus: good|poor"),
    sort_by: str = Query("createdAt", description="Sort field: title|company|location|boardName|qualityStatus|createdAt"),
    sort_order: str = Query("desc", description="Sort order: asc|desc"),
    db=Depends(get_db),
):
    """Return paginated jobs for a run with summary counts."""
    try:
        jobs_col = db["jobs"]
        run_oid = ObjectId(run_id)

        query: dict = {"runId": run_oid}
        if quality:
            query["qualityStatus"] = quality

        total = await jobs_col.count_documents(query)
        skip = (page - 1) * limit
        
        # Validate sort_order
        sort_direction = 1 if sort_order == "asc" else -1
        
        cursor = jobs_col.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)

        prospects_col = db["prospects"]

        jobs = []
        company_ids_seen: dict = {}
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["runId"] = str(doc["runId"])
            company_oid = doc.get("companyId")
            if company_oid:
                doc["companyId"] = str(company_oid)
                # Count prospects per company (memoize)
                if company_oid not in company_ids_seen:
                    company_ids_seen[company_oid] = await prospects_col.count_documents(
                        {"companyId": company_oid, "isAccepted": True}
                    )
                doc["prospectCount"] = company_ids_seen[company_oid]
            else:
                doc["prospectCount"] = 0
            doc["industry"] = doc.get("industry") or ""
            doc["outreachCount"] = 0
            jobs.append(doc)

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": max(1, (total + limit - 1) // limit),
            "jobs": jobs,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching jobs: {str(e)}")


# ── DELETE /{run_id} ─────────────────────────────────────────────────────

@router.delete("/{run_id}")
async def delete_run(run_id: str, db=Depends(get_db)):
    try:
        runs_col = db["runs"]
        jobs_col = db["jobs"]
        run_oid = ObjectId(run_id)

        # Delete associated jobs
        jobs_res = await jobs_col.delete_many({"runId": run_oid})

        # Delete the run itself
        runs_res = await runs_col.delete_one({"_id": run_oid})

        if runs_res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Run not found")

        return {
            "success": True,
            "message": "Run and associated jobs deleted successfully",
            "deleted_jobs_count": jobs_res.deleted_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting run: {str(e)}")


# ── Stub endpoints used by the new run-results UI ───────────────────────

@router.get("/{run_id}/enrichment-credits")
async def get_enrichment_credits(run_id: str):
    """Stub credit status — enrichment is out of scope this iteration."""
    period_end = (datetime.now(timezone.utc) + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return {
        "creditsUsed": 0,
        "dailyLimit": 100,
        "creditsRemaining": 100,
        "perJobLimit": 50,
        "jobCredits": {},
        "periodEnd": period_end.isoformat(),
    }


@router.get("/{run_id}/outreach-status")
async def get_outreach_status(run_id: str):
    return {"records": []}


@router.post("/{run_id}/trigger-email-flow")
async def trigger_email_flow(run_id: str):
    return {"message": "Email outreach is not enabled in this iteration"}
