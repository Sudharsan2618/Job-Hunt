"""
Pipeline Orchestrator
Background task entry-point that coordinates:
  Phase 1: Job scraping + title rejection + dedup + store  (jobspy_service)
"""

from datetime import datetime
from typing import Any, Dict

from bson import ObjectId

from app.database import get_collection
from app.services.jobspy_service import scrape_and_store_jobs


async def process_run_background(run_id: str, run_config: Dict[str, Any]):
    """
    Background task called by POST /runs/start.

    Phase 1 — scrape + title-reject + dedup + store jobs
    """
    print(f"[Orchestrator] Starting run {run_id}")

    runs_col = await get_collection("runs")
    jobs_col = await get_collection("jobs")

    try:
        run_oid = ObjectId(run_id)
        now = datetime.utcnow()

        # Mark run active
        await runs_col.update_one(
            {"_id": run_oid},
            {"$set": {"status": "active", "updatedAt": now}},
        )

        # ── Phase 1: Scrape + title reject + store ──────────────────────
        phase1_stats = await scrape_and_store_jobs(run_oid, run_config, jobs_col)

        await runs_col.update_one(
            {"_id": run_oid},
            {
                "$set": {
                    "stats.totalJobsScraped": phase1_stats["total_scraped"],
                    "stats.inserted": phase1_stats["inserted"],
                    "stats.duplicates": phase1_stats["duplicates"],
                    "stats.acceptedJobs": phase1_stats["accepted"],
                    "stats.rejectedJobs": phase1_stats["rejected"],
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        print(f"[Orchestrator] Phase 1 done — {phase1_stats}")

        await runs_col.update_one(
            {"_id": run_oid},
            {
                "$set": {
                    "status": "completed",
                    "runEndedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        print(f"[Orchestrator] Run {run_id} completed")

    except Exception as exc:
        print(f"[Orchestrator] Run {run_id} failed: {exc}")
        import traceback
        traceback.print_exc()
        await runs_col.update_one(
            {"_id": ObjectId(run_id)},
            {
                "$set": {
                    "status": "cancelled",
                    "runEndedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        raise
