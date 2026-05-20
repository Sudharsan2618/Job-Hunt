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
from app.services.naukri_service import scrape_and_store_naukri_jobs


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

        # Get run document to check the source
        run_doc = await runs_col.find_one({"_id": run_oid})
        source = run_doc.get("source", "jobspy") if run_doc else "jobspy"

        site_names = run_config.get("siteName", [])
        
        # Check what we need to run based on siteName
        run_jobspy = "linkedin" in site_names
        run_naukri = "naukri" in site_names

        # Fallback if site_names is empty or doesn't match either
        if not run_jobspy and not run_naukri:
            if source in ["naukri", "mixed"]:
                run_naukri = True
            if source in ["jobspy", "mixed"]:
                run_jobspy = True

        total_scraped = 0
        total_inserted = 0
        total_duplicates = 0
        total_accepted = 0
        total_rejected = 0

        # Phase 1a: Jobspy scrape (Linkedin)
        if run_jobspy:
            # Create a localized config copy for Jobspy with only LinkedIn
            jobspy_config = run_config.copy()
            jobspy_config["siteName"] = ["linkedin"]
            
            print(f"[Orchestrator] Running JobSpy scraper for: {jobspy_config['siteName']}")
            js_stats = await scrape_and_store_jobs(run_oid, jobspy_config, jobs_col)
            total_scraped += js_stats.get("total_scraped", 0)
            total_inserted += js_stats.get("inserted", 0)
            total_duplicates += js_stats.get("duplicates", 0)
            total_accepted += js_stats.get("accepted", 0)
            total_rejected += js_stats.get("rejected", 0)

            # Update stats intermediate to let UI know progress
            await runs_col.update_one(
                {"_id": run_oid},
                {
                    "$set": {
                        "stats.totalJobsScraped": total_scraped,
                        "stats.inserted": total_inserted,
                        "stats.duplicates": total_duplicates,
                        "stats.acceptedJobs": total_accepted,
                        "stats.rejectedJobs": total_rejected,
                        "updatedAt": datetime.utcnow(),
                    }
                },
            )

        # Phase 1b: Naukri scrape
        if run_naukri:
            print("[Orchestrator] Running Naukri scraper")
            nk_stats = await scrape_and_store_naukri_jobs(run_oid, run_config, jobs_col)
            total_scraped += nk_stats.get("total_scraped", 0)
            total_inserted += nk_stats.get("inserted", 0)
            total_duplicates += nk_stats.get("duplicates", 0)
            total_accepted += nk_stats.get("accepted", 0)
            total_rejected += nk_stats.get("rejected", 0)

        phase1_stats = {
            "total_scraped": total_scraped,
            "inserted": total_inserted,
            "duplicates": total_duplicates,
            "accepted": total_accepted,
            "rejected": total_rejected
        }

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
