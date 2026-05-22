"""
Jobs API Endpoints
GET  /api/v1/jobs  - List all jobs (paginated, sortable)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_database
from bson import ObjectId

router = APIRouter()


async def get_db():
    return await get_database()


# ── GET / (list all jobs, paginated + sortable) ────────────────────────
@router.get("")
async def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    sort_by: str = Query(
        "createdAt",
        description="Sort field: title|company|location|boardName|qualityStatus|createdAt",
    ),
    sort_order: str = Query("desc", description="Sort order: asc|desc"),
    db=Depends(get_db),
):
    """
    Return paginated jobs from the entire jobs collection.
    Supports sorting by any column the UI needs.
    """
    try:
        jobs_col = db["jobs"]

        # Map UI field names to MongoDB field names
        field_map = {
            "title": "title",
            "company": "company",
            "location": "location",
            "boardName": "boardName",
            "jobBoard": "boardName",
            "qualityStatus": "qualityStatus",
            "quality": "qualityStatus",
            "createdAt": "createdAt",
            "postedDate": "createdAt",
        }
        mongo_field = field_map.get(sort_by, "createdAt")
        sort_direction = 1 if sort_order == "asc" else -1

        total = await jobs_col.count_documents({})
        skip = (page - 1) * limit

        cursor = (
            jobs_col.find()
            .sort(mongo_field, sort_direction)
            .skip(skip)
            .limit(limit)
        )

        jobs = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if doc.get("runId"):
                doc["runId"] = str(doc["runId"])
            if doc.get("companyId"):
                doc["companyId"] = str(doc["companyId"])
            if doc.get("canonicalId"):
                doc["canonicalId"] = str(doc["canonicalId"])
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


# ── GET /{job_id}/prospects ────────────────────────────────────────────
@router.get("/{job_id}/prospects")
async def get_job_prospects(job_id: str, db=Depends(get_db)):
    """Return prospects linked to the job's company. emailTemplate is stubbed."""
    try:
        job_oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job id")

    job = await db["jobs"].find_one({"_id": job_oid}, {"companyId": 1})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    company_id = job.get("companyId")
    prospects: list = []
    if company_id:
        cursor = db["prospects"].find({"companyId": company_id})
        async for p in cursor:
            p["_id"] = str(p["_id"])
            if p.get("runId"):
                p["runId"] = str(p["runId"])
            if p.get("companyId"):
                p["companyId"] = str(p["companyId"])
            prospects.append(p)

    return {"prospects": prospects, "emailTemplate": None}
