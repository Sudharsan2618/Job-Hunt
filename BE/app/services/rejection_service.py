"""Rejection service for title-based filtering."""

from difflib import SequenceMatcher
from typing import Iterable, Tuple

from app.config import (
    ACCEPTED_TITLE_KEYWORDS,
    REJECTED_TITLE_KEYWORDS,
)


class JobTitleRejectionService:
    """Evaluates job titles and returns acceptance + reason."""

    def __init__(
        self,
        accepted_keywords: Iterable[str] | None = None,
        rejected_keywords: Iterable[str] | None = None,
        fuzzy_threshold: float = 0.86,
    ) -> None:
        accepted = accepted_keywords if accepted_keywords is not None else ACCEPTED_TITLE_KEYWORDS
        rejected = rejected_keywords if rejected_keywords is not None else REJECTED_TITLE_KEYWORDS
        self.accepted_keywords = [k.strip().lower() for k in accepted if k]
        self.rejected_keywords = [k.strip().lower() for k in rejected if k]
        self.fuzzy_threshold = fuzzy_threshold

    def evaluate_title(self, title: str) -> Tuple[bool, str]:
        normalized_title = (title or "").strip().lower()
        if not normalized_title:
            return False, "Missing job title"

        if self._matches_any(normalized_title, self.rejected_keywords):
            return False, "Title matched rejected keywords"

        if self._matches_any(normalized_title, self.accepted_keywords):
            return True, ""

        return False, "Title not in accepted keywords"

    def _matches_any(self, text: str, keywords: list[str]) -> bool:
        for keyword in keywords:
            if keyword in text:
                return True
            ratio = SequenceMatcher(None, text, keyword).ratio()
            if ratio >= self.fuzzy_threshold:
                return True
            for token in text.split():
                if SequenceMatcher(None, token, keyword).ratio() >= self.fuzzy_threshold:
                    return True
        return False
