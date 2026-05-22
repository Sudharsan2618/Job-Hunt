"""
HR Assistant Configuration
Ported from Job-Hunt/BE/app/config.py
"""
import re
from pydantic_settings import BaseSettings
from pydantic import Field


class HRAssistantSettings(BaseSettings):
    # MongoDB Configuration
    MONGODB_URI: str = Field(description="MongoDB connection string")
    DATABASE_NAME: str = Field(description="Database name")

    # LinkedIn Credentials (for company info API)
    LINKEDIN_EMAIL: str = Field(default="", description="LinkedIn login email")
    LINKEDIN_PASSWORD: str = Field(default="", description="LinkedIn login password")

    # Apollo API
    APOLLO_API_KEY: str = Field(default="", description="Apollo.io API key")

    # OpenAI API (for company enrichment)
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API key for company data extraction")

    # Company rejection thresholds
    MAX_STAFF_COUNT: int = Field(default=10000, description="Reject companies with more employees than this")

    # Email Configuration (MS Graph API)
    EMAIL_SENDER: str = Field(default="", description="Sender email address for outreach")
    AZURE_TENANT_ID: str = Field(default="", description="Azure tenant ID for MS Graph")
    AZURE_CLIENT_ID: str = Field(default="", description="Azure client ID for MS Graph")
    AZURE_CLIENT_SECRET: str = Field(default="", description="Azure client secret for MS Graph")
    MS_GRAPH_BASE_URL: str = Field(default="https://graph.microsoft.com/v1.0", description="MS Graph API base URL")
    # Email Configuration (Zepto Mail)
    ZEPTOMAIL_API_KEY: str = Field(default="", description="Zepto Mail API key")
    ZEPTOMAIL_SENDER_ADDRESS: str = Field(default="kd@d1-mail.com", description="Sender email address for outreach")
    ZEPTOMAIL_SENDER_NAME: str = Field(default="DestinationOne", description="Sender name for outreach")




    def validate_azure_config(self):
        """Validate that required Azure credentials are set for email sending."""
        if not self.AZURE_TENANT_ID:
            raise ValueError("HR_AZURE_TENANT_ID environment variable is required for email sending")
        if not self.AZURE_CLIENT_ID:
            raise ValueError("HR_AZURE_CLIENT_ID environment variable is required for email sending")
        if not self.AZURE_CLIENT_SECRET:
            raise ValueError("HR_AZURE_CLIENT_SECRET environment variable is required for email sending")
        if not self.EMAIL_SENDER:
            raise ValueError("HR_EMAIL_SENDER environment variable is required for email sending")
    
    def validate_zeptomail_config(self) -> None:
        missing = [
            name for name, val in {
            "ZEPTOMAIL_API_KEY":  self.ZEPTOMAIL_API_KEY,
            "ZEPTOMAIL_SENDER_ADDRESS": self.ZEPTOMAIL_SENDER_ADDRESS,
            "ZEPTOMAIL_SENDER_NAME": self.ZEPTOMAIL_SENDER_NAME,
        }.items()
        if not val
        ]
        if missing:
            raise ValueError(f"Missing Zepto Mail config: {', '.join(missing)}")
    model_config = {
        "env_prefix": "HR_",
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


# Accept these titles (executive / leadership level)
ACCEPTED_TITLE_KEYWORDS = [
    # C-Suite
    "ceo", "cfo", "coo", "cto", "cio", "cmo", "chro", "cro",
    "chief executive", "chief financial", "chief operating",
    "chief technology", "chief information", "chief medical",
    "chief human resources", "chief revenue", "chief administrative",
    # Executive
    "executive director", "managing director", "general manager",
    "president", "city manager", "town manager", "deputy city manager",
    "general counsel",
    # VP
    "vice president", "vp ", "vp,", "avp", "assistant vice president",
    "senior vice president", "svp",
    # Director
    "director",
    # Head
    "head of",
    # Senior Advisor
    "senior advisor",
    # Other leadership
    "plant manager", "general superintendent",
    "board director",
]

# Reject these titles (non-executive roles that might contain exec keywords)
REJECTED_TITLE_KEYWORDS = [
    "assistant to", "secretary to", "office of the ceo",
    "executive assistant", "admin assistant",
    "coordinator", "analyst", "intern", "junior",
    "mayor", "councillor", "council member", "elected",
    "board directors", "non-director committee", "volunteer"
]

TARGET_INDUSTRY_KEYWORDS = [
    # Government
    "government", "public administration", "public policy", "municipal",
    "provincial", "federal", "crown corporation", "civic", "public sector",
    # Not-for-profit
    "non-profit", "nonprofit", "not-for-profit", "ngo", "foundation",
    "charity", "charitable", "social enterprise", "philanthropy",
    # Clean Technology
    "renewable", "solar", "wind energy", "clean tech", "cleantech",
    "sustainability", "carbon", "environmental services", "green energy",
    # Engineering & Construction
    "construction", "civil engineering", "building materials",
    "architecture", "infrastructure", "real estate",
    # Healthcare
    "hospital", "health care", "healthcare", "medical practice",
    "mental health", "wellness", "clinics", "health authority",
    # Medical Technology
    "medical device", "medtech", "biotech", "biotechnology",
    "diagnostics", "pharmaceutical", "digital health",
    
]

# Industries to REJECT (IT, software, staffing, consulting, etc.)
REJECTED_INDUSTRY_KEYWORDS = [
    "software", "information technology", "it services", "it consulting",
    "computer", "internet", "saas", "cloud", "cybersecurity", "data",
    "staffing", "recruiting", "recruitment", "employment",
    "human resources services", "temporary help",
    "consulting", "management consulting", "business consulting",
    "outsourcing", "professional services",
    "advertising", "marketing", "public relations",
    "venture capital", "private equity",
    "investment", "banking", "financial services", "insurance",
    "design services",
    # Hospitality / Tourism
    "hospitality", "leisure", "tourism", "restaurants",
    "food & beverages", "food and beverages", "lodging",
    # Education
    "education", "higher education", "primary", "secondary",
    "school", "university", "college", "k-12",
    # Education Technology
    "e-learning", "edtech", "online training", "education technology",
    # Legal
    "law practice", "legal", "law firm",
    # Accounting
    "accounting", "audit", "bookkeeping", "tax",
    # Mining & Resources
    "mining", "oil", "gas", "natural resources", "metals",
    "quarrying", "petroleum",
]


# Apollo API settings
APOLLO_BASE_URL = "https://api.apollo.io/api/v1"
APOLLO_PER_PAGE = 100
APOLLO_BULK_BATCH_SIZE = 10
APOLLO_SENIORITIES = ["c_suite", "vp", "head", "director"]

# Buyer persona filter rules
HR_KEYWORDS = ["hr", "human resource", "people", "talent", "recruitment", "workforce", "culture"]
OPS_KEYWORDS = ["operation", "ops"]
CSUITE_SENIORITIES = {"c_suite", "owner", "founder", "partner"}
WANTED_FUNCTIONS = ["hr", "human resource", "people", "talent", "operation", "ops"]
UNWANTED_FUNCTIONS = [
    "finance", "financial", "marketing", "sales", "technology", "tech",
    "analytics", "asset", "culinary", "food", "recreation", "care",
    "clinical", "medical", "information technology",
]

# Per-industry exclusions from UNWANTED_FUNCTIONS
INDUSTRY_UNWANTED_EXCLUSIONS = {
    "healthcare":           ["care", "clinical", "medical"],
    "medical_technology":   ["care", "clinical", "medical"],
    "clean_technology":     ["technology", "tech"],
    "education_technology": ["technology", "tech"],
    "accounting":           ["finance", "financial"],
}

# LinkedIn industry name → slug mapping
INDUSTRY_SLUG_MAP = {
    # Government
    "government administration":            "government",
    "government relations":                 "government",
    "public policy":                        "government",
    "public safety":                        "government",
    "military":                             "government",
    "judiciary":                            "government",
    "legislative office":                   "government",
    "political organization":               "government",
    "international affairs":                "government",
    "international trade and development":  "government",
    "defense & space":                      "government",
    "defense and space":                    "government",
    "law enforcement":                      "government",
    # Not-For-Profit
    "nonprofit organization management":    "not_for_profit",
    "non-profit organizations":             "not_for_profit",
    "non-profit organization management":   "not_for_profit",
    "philanthropy":                         "not_for_profit",
    "civic & social organization":          "not_for_profit",
    "civic and social organization":        "not_for_profit",
    "religious institutions":               "not_for_profit",
    "fund-raising":                         "not_for_profit",
    "fundraising":                          "not_for_profit",
    "think tanks":                          "not_for_profit",
    "individual & family services":         "not_for_profit",
    "individual and family services":       "not_for_profit",
    "museums and institutions":             "not_for_profit",
    # Clean Technology
    "renewables & environment":             "clean_technology",
    "renewables and environment":           "clean_technology",
    "renewable energy semiconductor manufacturing": "clean_technology",
    "environmental services":               "clean_technology",
    "utilities":                            "clean_technology",
    "solar energy":                         "clean_technology",
    "wind energy":                          "clean_technology",
    # Engineering & Construction
    "construction":                         "engineering_construction",
    "civil engineering":                    "engineering_construction",
    "architecture & planning":              "engineering_construction",
    "architecture and planning":            "engineering_construction",
    "real estate":                          "engineering_construction",
    "building materials":                   "engineering_construction",
    "mechanical or industrial engineering": "engineering_construction",
    "glass, ceramics & concrete":           "engineering_construction",
    "glass ceramics and concrete":          "engineering_construction",
    "industrial automation":                "engineering_construction",
    # Healthcare
    "hospital & health care":               "healthcare",
    "hospitals and health care":            "healthcare",
    "health, wellness and fitness":         "healthcare",
    "wellness and fitness services":        "healthcare",
    "mental health care":                   "healthcare",
    "alternative medicine":                 "healthcare",
    "veterinary":                           "healthcare",
    # Medical Technology
    "medical devices":                      "medical_technology",
    "biotechnology":                        "medical_technology",
    "pharmaceuticals":                      "medical_technology",
    "medical practice":                     "medical_technology",
    "clinical research":                    "medical_technology",
    # Education
    "education management":                 "education",
    "higher education":                     "education",
    "primary/secondary education":          "education",
    "primary and secondary education":      "education",
    "libraries":                            "education",
    "research":                             "education",
    # Education Technology
    "e-learning":                           "education_technology",
    "professional training & coaching":     "education_technology",
    "professional training and coaching":   "education_technology",
    # Legal
    "law practice":                         "legal",
    "legal services":                       "legal",
    "alternative dispute resolution":       "legal",
    # Accounting
    "accounting":                           "accounting",
    # Banking & Finance (for tracking, but will be rejected by REJECTED_INDUSTRY_KEYWORDS)
    "banking":                              "accounting",
    "investment banking":                   "accounting",
    "financial services":                   "accounting",
    "investment management":                "accounting",
    "venture capital & private equity":     "accounting",
    "venture capital and private equity":   "accounting",
    # Consulting (for tracking, but will be rejected by REJECTED_INDUSTRY_KEYWORDS)
    "management consulting":               "accounting",
    "business consulting":                  "accounting",
    # IT & Technology (for tracking, but will be rejected by REJECTED_INDUSTRY_KEYWORDS)
    "information technology & services":    "accounting",
    "information technology and services":   "accounting",
    "software":                            "accounting",
    # Staffing (for tracking, but will be rejected by REJECTED_INDUSTRY_KEYWORDS)
    "staffing & recruiting":                "accounting",
    "staffing and recruiting":              "accounting",
    "human resources services":             "accounting",
    # Entertainment (for tracking, but will be rejected by REJECTED_INDUSTRY_KEYWORDS)
    "entertainment":                        "accounting",
    "music":                                "accounting",
    "media production":                     "accounting",
    # Mining & Resources
    "mining & metals":                      "mining_resources",
    "mining and metals":                    "mining_resources",
    "oil & energy":                         "mining_resources",
    "oil and gas":                          "mining_resources",
    "oil and energy":                       "mining_resources",
    "chemicals":                            "mining_resources",
    "paper & forest products":              "mining_resources",
    "paper and forest products":            "mining_resources",
}


def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = text.replace("&", "and")
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


_NORMALIZED_SLUG_MAP = {
    _normalize(key): slug for key, slug in INDUSTRY_SLUG_MAP.items()
}

def get_industry_keywords_for_slugs(industry_slugs: list[str]) -> dict:
    """
    Generate dynamic target/reject keywords based on selected industry slugs.
    
    Args:
        industry_slugs: List of industry slugs (e.g., ['government', 'healthcare'])
    
    Returns:
        dict with 'target_keywords' and 'rejected_keywords' lists
    """
    # Map slugs to their LinkedIn name variants from INDUSTRY_SLUG_MAP
    target_keywords = []
    
    for slug in industry_slugs:
        # Find all LinkedIn names that map to this slug
        for linkedin_name, mapped_slug in INDUSTRY_SLUG_MAP.items():
            if mapped_slug == slug:
                target_keywords.append(linkedin_name.lower())
    
    # Add generic keywords for each slug
    slug_to_generic_keywords = {
        "government": ["government", "public administration", "public policy", "municipal", "provincial", "federal"],
        "not_for_profit": ["non-profit", "nonprofit", "not-for-profit", "ngo", "foundation", "charity"],
        "clean_technology": ["renewable", "solar", "wind energy", "clean tech", "sustainability"],
        "engineering_construction": ["construction", "civil engineering", "architecture", "infrastructure"],
        "healthcare": ["hospital", "health care", "healthcare", "medical practice", "wellness"],
        "medical_technology": ["medical device", "medtech", "biotech", "biotechnology", "pharmaceutical"],
        "education": ["education", "higher education", "school", "university", "college"],
        "education_technology": ["e-learning", "edtech", "education technology"],
        "legal": ["law practice", "legal", "law firm"],
        "accounting": ["accounting", "audit", "bookkeeping"],
        "mining_resources": ["mining", "oil", "gas", "natural resources", "metals"],
    }
    
    for slug in industry_slugs:
        if slug in slug_to_generic_keywords:
            target_keywords.extend(slug_to_generic_keywords[slug])
    
    # Remove duplicates
    target_keywords = list(set(target_keywords))
    
    # Rejected keywords - keep the same (everything NOT in target list)
    rejected_keywords = [k.strip().lower() for k in REJECTED_INDUSTRY_KEYWORDS if k]
    
    return {
        "target_keywords": target_keywords,
        "rejected_keywords": rejected_keywords,
    }


def resolve_industry_slug(industries: list[str]) -> str | None:
    """Resolve LinkedIn industries to one of 11 target slugs."""
    for industry in industries:
        slug = INDUSTRY_SLUG_MAP.get(industry.lower().strip())
        if slug:
            return slug
        norm_input = _normalize(industry)
        slug = _NORMALIZED_SLUG_MAP.get(norm_input)
        if slug:
            return slug
        for norm_key, slug in _NORMALIZED_SLUG_MAP.items():
            if norm_input in norm_key or norm_key in norm_input:
                return slug
    return None


# Buyer persona titles per industry vertical
INDUSTRY_PERSONA_MAP = {
    "government": [
        "Chief Administrative Officer",
        "City Manager",
        "Deputy City Manager",
        "Director of Human Resources",
    ],
    "not_for_profit": [
        "Board Chair",
        "Board Director",
        "President",
        "Executive Director",
        "VP of People & Culture",
    ],
    "clean_technology": [
        "Founder",
        "Co-Founder",
        "Chief Executive Officer",
        "Chief Operating Officer",
        "Chief Technology Officer",
    ],
    "engineering_construction": [
        "Founder",
        "Co-Founder",
        "Chief Executive Officer",
        "Chief Operating Officer",
        "Chief Technology Officer",
    ],
    "healthcare": [
        "Hospital Administrator",
        "Chief Medical Officer",
        "VP of Operations",
        "VP of Talent Acquisition",
    ],
    "medical_technology": [
        "Hospital Administrator",
        "Chief Medical Officer",
        "VP of Operations",
        "VP of Talent Acquisition",
    ],
    "education": [
        "Chief Executive Officer",
        "Chief Operating Officer",
        "VP of HR",
        "Chief Human Resources Officer",
        "Director of Talent Acquisition",
    ],
    "education_technology": [
        "Chief Executive Officer",
        "Chief Operating Officer",
        "VP of HR",
        "Director of Talent Acquisition",
    ],
    "legal": [
        "Managing Partner",
        "Chief Operating Officer",
        "Director of Human Resources",
    ],
    "accounting": [
        "Managing Partner",
        "Chief Executive Officer",
        "Chief Operating Officer",
        "Director of Human Resources",
    ],
    "mining_resources": [
        "VP of Operations",
        "VP of Talent Acquisition",
        "Chief Operating Officer",
        "Director of Human Resources",
    ],
}

# Fallback for industries outside the 11 target verticals
DEFAULT_PERSONA_TITLES = [
    "Chief Executive Officer",
    "Chief Operating Officer",
    "Chief Human Resources Officer",
    "VP of HR",
    "VP People & Culture",
    "Director of Talent Acquisition",
]


def get_persona_titles(industries: list[str]) -> list[str]:
    """LinkedIn industries → slug → buyer persona titles."""
    slug = resolve_industry_slug(industries)
    if slug:
        return INDUSTRY_PERSONA_MAP[slug]
    return DEFAULT_PERSONA_TITLES


# Singleton settings instance
hr_settings = HRAssistantSettings()
