"""Apollo Service — prospect search, enrichment, and persona discovery.
Ported from Job-Hunt/BE/app/services/apollo_service.py
"""

import logging
import time
from typing import Any
import uuid
import random
import string
from typing import Optional
import requests

from .config import (
    APOLLO_BASE_URL,
    APOLLO_PER_PAGE,
    APOLLO_BULK_BATCH_SIZE,
    APOLLO_SENIORITIES,
    INDUSTRY_PERSONA_MAP,
    DEFAULT_PERSONA_TITLES,
    hr_settings,
)
from .rejection_service import ProspectPreFilter, ProspectPostFilter

logger = logging.getLogger(__name__)


class ApolloService:
    """Apollo API client for people search and enrichment."""

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or hr_settings.APOLLO_API_KEY

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
        logger.info("Title search for %d title(s) at %s", len(titles), domain)

        while True:
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
            data = resp.json()

            people = data.get("people", [])
            total = data.get("total_entries", 0)
            pages = max(1, -(-total // APOLLO_PER_PAGE))

            all_people.extend(people)
            logger.info("Page %d/%d — %d/%d fetched", page, pages, len(all_people), total)

            if page >= pages or not people:
                break
            page += 1
            time.sleep(0.5)

        logger.info("Title search returned %d people", len(all_people))
        return all_people

    def search_by_seniority(self, domain: str) -> list[dict]:
        """Fallback search — fetch prospects by seniority level."""
        all_people: list[dict] = []
        page = 1
        logger.info("Seniority search at %s", domain)

        while True:
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
            data = resp.json()

            people = data.get("people", [])
            total = data.get("total_entries", 0)
            pages = max(1, -(-total // APOLLO_PER_PAGE))

            all_people.extend(people)
            logger.info("Page %d/%d — %d/%d fetched", page, pages, len(all_people), total)

            if page >= pages or not people:
                break
            page += 1
            time.sleep(0.5)

        logger.info("Seniority search returned %d people", len(all_people))
        return all_people

    # ------------------------------------------------------------------
    # Enrichment
    # ------------------------------------------------------------------

    def enrich(self, people: list[dict]) -> list[dict]:
        """Enrich prospects — bulk batches for >10, single calls otherwise."""

        # ⚠️ TEST-ONLY: Limit enrichment to 3 prospects per call to save Apollo credits.
        # 🔄 REVERT FOR PRODUCTION: Remove (or comment out) the next 3 lines below
        #    to restore full enrichment of all prospects.
        _TEST_MAX_ENRICH = 3
        if len(people) > _TEST_MAX_ENRICH:
            logger.warning("[TEST MODE] Capping enrichment from %d → %d to save credits", len(people), _TEST_MAX_ENRICH)
            people = people[:_TEST_MAX_ENRICH]

        enriched: list[dict] = []
        total = len(people)

        if total > APOLLO_BULK_BATCH_SIZE:
            cutoff = (total // APOLLO_BULK_BATCH_SIZE) * APOLLO_BULK_BATCH_SIZE
            bulk_people = people[:cutoff]
            remainder = people[cutoff:]
            batches = [
                bulk_people[i : i + APOLLO_BULK_BATCH_SIZE]
                for i in range(0, len(bulk_people), APOLLO_BULK_BATCH_SIZE)
            ]
            logger.info("Enriching: %d bulk batch(es) + %d single call(s)", len(batches), len(remainder))

            for i, batch in enumerate(batches, 1):
                results = self._enrich_bulk(batch)
                enriched.extend(results)
                logger.info("Bulk %d/%d — got %d", i, len(batches), len(results))
                time.sleep(0.5)

            for person in remainder:
                result = self._enrich_single(person)
                if result:
                    enriched.append(result)
                time.sleep(0.3)
        else:
            logger.info("Enriching %d prospect(s) via single calls", total)
            for person in people:
                result = self._enrich_single(person)
                if result:
                    enriched.append(result)
                time.sleep(0.3)

        logger.info("Enriched %d/%d prospects", len(enriched), total)
        return enriched

    def _enrich_bulk(self, people: list[dict]) -> list[dict]:
        """Enrich a batch of up to 10 people in one call."""
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
            logger.error("Bulk enrich error: %s", e)
            return []

    def _enrich_single(self, person: dict) -> dict | None:
        """Enrich a single person by ID."""
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
            logger.error("Enrich error for %s: %s", pid, e)
            return None

    # ------------------------------------------------------------------
    # Full pipeline
    # ------------------------------------------------------------------

    def find_prospects(self, domain: str, industry_slug: str, enrich_prospects: bool = True) -> dict[str, Any]:
        """
        Full prospect discovery pipeline.
        Returns dict with:
          strategy   — "primary" or "fallback"
          accepted   — prospects that passed all filters
          rejected   — prospects rejected at any step
          stats      — counts at each stage
        """
        titles = INDUSTRY_PERSONA_MAP.get(industry_slug, DEFAULT_PERSONA_TITLES)

        # Step 1: title-based search
        title_hits = self.search_by_titles(domain, titles)
        if title_hits:
            if enrich_prospects:
                enriched = self.enrich(title_hits)
            else:
                enriched = title_hits # Use raw hits if enrichment is skipped

            for p in enriched:
                p["_filter_step"] = "selected"
                p["_match_reasons"] = ["primary_title_match"]
            
            logger.info("Primary path: %d title hits → %d processed (enriched=%s)", len(title_hits), len(enriched), enrich_prospects)
            return {
                "strategy": "primary",
                "accepted": enriched,
                "rejected": [],
                "stats": {
                    "title_hits": len(title_hits), 
                    "processed": len(enriched), 
                    "selected": len(enriched),
                    "is_enriched": enrich_prospects
                },
            }

        # Step 2: fallback — seniority search + filtering
        logger.info("Title search empty, falling back to seniority search")
        raw = self.search_by_seniority(domain)

        pre_filter = ProspectPreFilter(industry_slug)
        pre_accepted, pre_rejected = pre_filter.filter(raw)

        if enrich_prospects:
            processed = self.enrich(pre_accepted)
        else:
            processed = pre_accepted

        post_filter = ProspectPostFilter(industry_slug)
        post_accepted, post_rejected = post_filter.extract_personas(processed)

        all_rejected = pre_rejected + post_rejected

        logger.info(
            "Fallback path: %d raw → %d pre-accepted → %d processed (enriched=%s) → %d selected, %d total rejected",
            len(raw), len(pre_accepted), len(processed), enrich_prospects, len(post_accepted), len(all_rejected),
        )
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
                "is_enriched": enrich_prospects
            },
        }


class OpenAICompanyService:
    """
    Drop-in replacement for ApolloCompanyService.

    Uses OpenAI (GPT-4o-mini) to extract company metadata from a LinkedIn
    company URL.  Returns the **same dict shape** as the old Apollo class so
    the rest of the pipeline (orchestrator, rejection service) works unchanged.

    Required output keys:
        companyName, companyDomain, companyIndustries, staffCount,
        description, website
    """

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        from openai import OpenAI
        self._client = OpenAI(api_key=api_key)
        self._model = model

    # ── slug helper (unchanged from Apollo) ──────────────────────────────

    @staticmethod
    def get_slug(linkedin_url: str) -> Optional[str]:
        """Extract company slug from LinkedIn URL."""
        try:
            parts = linkedin_url.rstrip("/").split("/")
            idx = parts.index("company")
            return parts[idx + 1]
        except (ValueError, IndexError):
            return None

    # ── core method ──────────────────────────────────────────────────────

    # Target industry slugs for matching
    INDUSTRY_SLUGS = [
        "government", "not_for_profit", "clean_technology",
        "engineering_construction", "healthcare", "medical_technology",
        "education", "education_technology", "legal", "accounting",
        "mining_resources",
    ]

    def fetch_company_info(self, linkedin_url: str, target_industry_slugs: list[str] | None = None) -> Optional[dict]:
        """
        Extract company metadata from a LinkedIn URL using OpenAI.
        
        Args:
            linkedin_url: LinkedIn company URL
            target_industry_slugs: List of target industry slugs to match against.
                                   If None, uses all 11 default slugs.
    
        Returns dict with keys:
            companyName, companyDomain, companyIndustry, staffCount,
            website, industrySlug, targeted
        """
        import json as _json
    
        # Use provided slugs or default to all 11
        slugs_to_match = target_industry_slugs or self.INDUSTRY_SLUGS
    
        # Build dynamic industry matching prompt
        industry_descriptions = {
            "government": "government bodies, public policy, defense, law enforcement, public safety, military, international affairs",
            "not_for_profit": "nonprofits, philanthropy, civic organizations, religious institutions, fundraising, think tanks",
            "clean_technology": "renewables, environmental services, utilities, solar energy, wind energy",
            "engineering_construction": "construction, civil engineering, architecture, real estate, building materials, industrial engineering",
            "healthcare": "hospitals, health care, wellness, fitness, mental health, veterinary",
            "medical_technology": "medical devices, biotechnology, pharmaceuticals, diagnostics",
            "education": "education management, higher education, schools, universities, libraries, research",
            "education_technology": "e-learning, professional training, education technology",
            "legal": "law practice, legal services, alternative dispute resolution",
            "accounting": "accounting, audit, bookkeeping, tax services",
            "mining_resources": "mining, metals, oil, gas, natural resources, petroleum",
        }
    
        # Build the categories section dynamically
        categories_text = "\n".join([
            f"- {slug}: {industry_descriptions.get(slug, slug)}"
            for slug in slugs_to_match
        ])
    
        prompt = (
            f"URL: {linkedin_url}\n\n"
            "Extract company info from the LinkedIn URL above using your knowledge.\n\n"
            f"Then determine the industry_slug by matching the company's industry to ONE of these categories:\n"
            f"{categories_text}\n\n"
            f"If the company's industry falls under any of the above (including sub-categories and related fields), "
            f"set industry_slug to that slug. Otherwise set it to null.\n\n"
            "Rules for targeted:\n"
            "- targeted = true ONLY if industry_slug is not null AND employee count is less than 10000\n"
            "- targeted = false if either condition fails or if you found the given company is a recruitment agency.\n\n"
            "Return ONLY valid JSON, no markdown, no explanation:\n"
            "{\n"
            '  "company_name": "official company name",\n'
            '  "company_domain_url": "website domain (e.g. example.com)",\n'
            '  "company_industry": "primary industry",\n'
            '  "company_size": employee_count_as_integer,\n'
            '  "company_website": "full website URL",\n'
            '  "industry_slug": "matching_slug_or_null",\n'
            '  "targeted": true_or_false\n'
            "}\n"
        )
    
        logger.info("[OpenAICompany] Full prompt for %s:\n%s", linkedin_url, prompt)
    
        max_retries = 2
        for attempt in range(1, max_retries + 1):
            try:
                completion = self._client.chat.completions.create(
                    model=self._model,
                    temperature=0,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a data extraction assistant. "
                                "You extract company information and return only valid JSON."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                )
                raw = completion.choices[0].message.content or ""
    
                # Strip markdown fences if present
                raw = raw.strip()
                if raw.startswith("```"):
                    raw = raw.split("\n", 1)[-1]
                if raw.endswith("```"):
                    raw = raw.rsplit("```", 1)[0]
                raw = raw.strip()
    
                data = _json.loads(raw)
    
                # Parse staffCount — handle strings like "50", "~200", ranges
                staff_raw = data.get("company_size", 0)
                if isinstance(staff_raw, str):
                    import re
                    nums = re.findall(r"\d+", staff_raw.replace(",", ""))
                    staff_count = int(nums[0]) if nums else 0
                else:
                    staff_count = int(staff_raw) if staff_raw else 0
    
                # Parse industry_slug — validate it's in our target list
                industry_slug = data.get("industry_slug")
                if industry_slug and industry_slug not in slugs_to_match:
                    industry_slug = None
    
                # Targeted = industry matches AND size < 10k
                targeted = bool(data.get("targeted", False))
                # Double-check: override if GPT hallucinated
                if not industry_slug or staff_count >= 10000:
                    targeted = False
    
                return {
                    "companyName":     data.get("company_name", ""),
                    "companyDomain":   (data.get("company_domain_url", "") or "")
                                       .replace("https://", "")
                                       .replace("http://", "")
                                       .rstrip("/"),
                    "companyIndustry": data.get("company_industry", ""),
                    "staffCount":      staff_count,
                    "website":         data.get("company_website", ""),
                    "industrySlug":    industry_slug,
                    "targeted":        targeted,
                }
    
            except _json.JSONDecodeError:
                logger.warning(
                    "[OpenAICompany] JSON parse failed (attempt %d/%d) for %s — raw: %.200s",
                    attempt, max_retries, linkedin_url, raw,
                )
                if attempt < max_retries:
                    continue
                return None
            except Exception as e:
                logger.error(
                    "[OpenAICompany] OpenAI call failed (attempt %d/%d) for %s: %s",
                    attempt, max_retries, linkedin_url, e,
                )
                if attempt < max_retries:
                    import time
                    time.sleep(1)
                    continue
                return None
    
        return None