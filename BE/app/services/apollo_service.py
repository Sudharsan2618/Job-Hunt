"""
Apollo Service — prospect search (no enrichment in the default pipeline).
Enrichment functions are kept for later on-demand use but the orchestrator
calls find_prospects(..., enrich=False).
"""
import logging
import time
from typing import Any

import requests

from app.config import (
    APOLLO_BASE_URL,
    APOLLO_PER_PAGE,
    APOLLO_BULK_BATCH_SIZE,
    APOLLO_SENIORITIES,
    INDUSTRY_PERSONA_MAP,
    DEFAULT_PERSONA_TITLES,
    normalize_industry_name,
    settings,
)
from app.services.rejection_service import ProspectPreFilter, ProspectPostFilter

logger = logging.getLogger(__name__)


class ApolloService:
    """Apollo API client for people search and (optional) enrichment."""

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or settings.APOLLO_API_KEY

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self._api_key,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
        }

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search_by_titles(self, domain: str, titles: list[str]) -> list[dict]:
        """Primary search — query Apollo with specific job titles."""
        all_people: list[dict] = []
        page = 1
        logger.info("Title search: %d title(s) at %s", len(titles), domain)

        while True:
            try:
                resp = requests.post(
                    f"{APOLLO_BASE_URL}/mixed_people/api_search",
                    headers=self._headers(),
                    params={
                        "per_page": APOLLO_PER_PAGE,
                        "page": page,
                        "person_titles[]": titles,
                        "include_similar_titles": "true",
                        "q_organization_domains_list[]": [domain],
                    },
                    timeout=30,
                )
                resp.raise_for_status()
            except Exception as e:
                logger.error("Apollo title search error at %s p%d: %s", domain, page, e)
                break

            data = resp.json()
            people = data.get("people", [])
            total = data.get("total_entries", 0)
            pages = max(1, -(-total // APOLLO_PER_PAGE))

            all_people.extend(people)
            if page >= pages or not people:
                break
            page += 1
            time.sleep(0.5)

        return all_people

    def search_by_seniority(self, domain: str) -> list[dict]:
        """Fallback search — fetch prospects by seniority level."""
        all_people: list[dict] = []
        page = 1
        logger.info("Seniority search at %s", domain)

        while True:
            try:
                resp = requests.post(
                    f"{APOLLO_BASE_URL}/mixed_people/api_search",
                    headers=self._headers(),
                    params={
                        "per_page": APOLLO_PER_PAGE,
                        "page": page,
                        "person_seniorities[]": APOLLO_SENIORITIES,
                        "q_organization_domains_list[]": [domain],
                    },
                    timeout=30,
                )
                resp.raise_for_status()
            except Exception as e:
                logger.error("Apollo seniority search error at %s p%d: %s", domain, page, e)
                break

            data = resp.json()
            people = data.get("people", [])
            total = data.get("total_entries", 0)
            pages = max(1, -(-total // APOLLO_PER_PAGE))

            all_people.extend(people)
            if page >= pages or not people:
                break
            page += 1
            time.sleep(0.5)

        return all_people

    # ------------------------------------------------------------------
    # Enrichment (kept for on-demand use; not invoked by orchestrator)
    # ------------------------------------------------------------------

    def enrich(self, people: list[dict]) -> list[dict]:
        enriched: list[dict] = []
        total = len(people)
        if total == 0:
            return enriched

        if total > APOLLO_BULK_BATCH_SIZE:
            cutoff = (total // APOLLO_BULK_BATCH_SIZE) * APOLLO_BULK_BATCH_SIZE
            bulk_people = people[:cutoff]
            remainder = people[cutoff:]
            for i in range(0, len(bulk_people), APOLLO_BULK_BATCH_SIZE):
                batch = bulk_people[i : i + APOLLO_BULK_BATCH_SIZE]
                enriched.extend(self._enrich_bulk(batch))
                time.sleep(0.5)
            for person in remainder:
                r = self._enrich_single(person)
                if r:
                    enriched.append(r)
                time.sleep(0.3)
        else:
            for person in people:
                r = self._enrich_single(person)
                if r:
                    enriched.append(r)
                time.sleep(0.3)
        return enriched

    def _enrich_bulk(self, people: list[dict]) -> list[dict]:
        details = [{"id": p["id"]} for p in people if p.get("id")]
        if not details:
            return []
        try:
            resp = requests.post(
                f"{APOLLO_BASE_URL}/people/bulk_match",
                headers=self._headers(),
                json={"details": details, "reveal_personal_emails": True},
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json().get("matches", [])
        except Exception as e:
            logger.error("Apollo bulk enrich error: %s", e)
            return []

    def _enrich_single(self, person: dict) -> dict | None:
        pid = person.get("id")
        if not pid:
            return None
        try:
            resp = requests.post(
                f"{APOLLO_BASE_URL}/people/match",
                headers=self._headers(),
                json={"id": pid, "reveal_personal_emails": True},
                timeout=15,
            )
            resp.raise_for_status()
            return resp.json().get("person", {})
        except Exception as e:
            logger.error("Apollo enrich error for %s: %s", pid, e)
            return None

    # ------------------------------------------------------------------
    # Full pipeline
    # ------------------------------------------------------------------

    def find_prospects(
        self,
        domain: str,
        industry_name: str | None,
        enrich: bool = False,
    ) -> dict[str, Any]:
        """
        Returns:
          strategy   — "primary" or "fallback"
          accepted   — prospects to keep
          rejected   — prospects rejected at any step
          stats      — counts per stage
        """
        if not domain:
            return {"strategy": "none", "accepted": [], "rejected": [], "stats": {}}

        key = normalize_industry_name(industry_name or "")
        titles = INDUSTRY_PERSONA_MAP.get(key, DEFAULT_PERSONA_TITLES)

        # Step 1 — title-based search
        title_hits = self.search_by_titles(domain, titles)
        if title_hits:
            processed = self.enrich(title_hits) if enrich else title_hits
            for p in processed:
                p["_filter_step"] = "selected"
                p.setdefault("_match_reasons", ["primary_title_match"])
            return {
                "strategy": "primary",
                "accepted": processed,
                "rejected": [],
                "stats": {
                    "title_hits": len(title_hits),
                    "processed": len(processed),
                    "selected": len(processed),
                    "is_enriched": enrich,
                },
            }

        # Step 2 — fallback to seniority + filters
        logger.info("Title search empty at %s, falling back to seniority", domain)
        raw = self.search_by_seniority(domain)

        pre_filter = ProspectPreFilter(industry_name)
        pre_accepted, pre_rejected = pre_filter.filter(raw)

        processed = self.enrich(pre_accepted) if enrich else pre_accepted

        post_filter = ProspectPostFilter(industry_name)
        post_accepted, post_rejected = post_filter.extract_personas(processed)

        all_rejected = pre_rejected + post_rejected
        return {
            "strategy": "fallback",
            "accepted": post_accepted,
            "rejected": all_rejected,
            "stats": {
                "raw_hits": len(raw),
                "pre_accepted": len(pre_accepted),
                "processed": len(processed),
                "selected": len(post_accepted),
                "rejected": len(all_rejected),
                "is_enriched": enrich,
            },
        }
