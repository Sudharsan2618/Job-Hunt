"""
LinkedIn Company Info Service
Fetch company details from LinkedIn API, extract slug/domain, return structured info.
"""

from typing import Any, Dict, Optional
from urllib.parse import urlparse

from linkedin_api import Linkedin

from app.config import settings


class LinkedInCompanyService:
    """Wraps linkedin_api to fetch and normalise company information."""

    def __init__(self, api: Linkedin | None = None) -> None:
        if api is not None:
            self._api = api
        else:
            self._api = Linkedin(settings.LINKEDIN_EMAIL, settings.LINKEDIN_PASSWORD)

    # ------------------------------------------------------------------
    # Slug / domain helpers
    # ------------------------------------------------------------------

    @staticmethod
    def get_slug(url: str) -> Optional[str]:
        """Extract company slug from a LinkedIn URL."""
        if not url:
            return None
        url = url.rstrip("/")
        parts = url.split("/")
        try:
            idx = parts.index("company")
            return parts[idx + 1] if idx + 1 < len(parts) else None
        except ValueError:
            return None

    @staticmethod
    def extract_domain(company_url: str) -> str:
        """Return bare domain from any URL (strips www.)."""
        if not company_url:
            return ""
        netloc = urlparse(company_url).netloc.lower().replace("www.", "")
        return netloc

    # ------------------------------------------------------------------
    # LinkedIn API calls
    # ------------------------------------------------------------------

    def fetch_company_raw(self, url: str) -> Optional[Dict[str, Any]]:
        """Call LinkedIn API and return the raw company dict (or None)."""
        slug = self.get_slug(url)
        if not slug:
            return None
        try:
            return self._api.get_company(slug)
        except Exception as exc:
            print(f"[LinkedIn] Error fetching {slug}: {exc}")
            return None

    def fetch_company_info(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Fetch company from LinkedIn and return only the fields we need:
          companyIndustries, staffingCompany, staffCount,
          description, companyPageUrl, companyName, website
        """
        data = self.fetch_company_raw(url)
        if data is None:
            return None

        industries: list[str] = []
        for ind in data.get("companyIndustries", []):
            name = ind.get("localizedName", "")
            if name:
                industries.append(name)

        website = data.get("companyPageUrl", "")
        domain = self.extract_domain(website)

        return {
            "companyName": data.get("name") or "",
            "companyIndustries": industries,
            "staffingCompany": data.get("staffingCompany", False),
            "staffCount": data.get("staffCount", 0),
            "description": data.get("description", ""),
            "companyPageUrl": website,
            "companyDomain": domain,
            "website": data.get("url", ""),
        }
