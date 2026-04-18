export interface Industry {
  id: string
  name: string
  selected: boolean
}

export interface Region {
  id: string
  name: string
  isPrimary: boolean
  enabled: boolean
  cities: City[]
}

export interface City {
  id: string
  name: string
  selected: boolean
}

export interface ExecutiveTier {
  id: string
  name: string
  score: number
}

export interface ICPConfig {
  industries: Industry[]
  regions: Region[]
  executiveTiers: ExecutiveTier[]
  negativeKeywords: string[]
}

export interface Lead {
  id: string
  score: number
  jobTitle: string
  leadId: string
  company: {
    name: string
    logo?: string
    initials?: string
  }
  location: string
  industryMatch: string[]
  postedDate: string
  url: string
}

export interface Prospect {
  id: string
  name: string
  title: string
  company: string
  linkedInUrl: string
  location: string
  avatar?: string
  matchScore: number
  matchedFor: string
  whyMatched: string
  contactInfo: {
    email: string
    emailConfidence: number
    phone?: string
  }
}

export interface ProcessingStep {
  id: number
  name: string
  icon: string
  status: "completed" | "active" | "pending"
}

export interface ProcessingStats {
  jobsScraped: number
  leadsQualified: number
  aiQueries: number
  prospectsFound: number
}

export interface TerminalLog {
  timestamp: string
  type: "info" | "success" | "ai_agent" | "error" | "warning"
  message: string
  highlight?: string
}

export interface WorkflowAgent {
  id: string
  name: string
  description: string
  icon: "mail" | "phone" | "megaphone" | "bot" | "linkedin" | "calendar"
  color: string
  prospectsCount: number
  activeCount: number
  completedCount: number
}

export interface WorkflowProspect {
  id: string
  prospectId: string
  name: string
  title: string
  company: string
  avatar?: string
  status: "pending" | "in_progress" | "completed" | "failed"
  addedAt: string
  lastActivity?: string
  history: WorkflowHistoryItem[]
}

export interface WorkflowHistoryItem {
  id: string
  timestamp: string
  action: string
  status: "success" | "pending" | "failed"
  details?: string
}

export interface SearchHistoryItem {
  id: string
  name: string
  createdAt: string
  industries: string[]
  regions: string[]
  executiveTitles: string[]
  resultsCount: number
  status: "completed" | "in_progress" | "draft"
}
