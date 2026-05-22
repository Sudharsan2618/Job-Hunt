const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export interface RunStats {
  totalJobsScraped: number
  uniqueCompanies: number
  acceptedCompanies: number
  rejectedCompanies: number
  totalProspects: number
  inserted?: number
  duplicates?: number
  acceptedJobs?: number
  rejectedJobs?: number
  skippedCompanies?: number
}

export interface RunConfig {
  searchTitles: string[]
  searchLocations: string[]
  targetIndustries: string[]
  customIndustries?: string[]
  hoursOld: number
  resultsPerSearch: number
  siteName: string[]
  searchUrl?: string
  icpConfigSnapshot?: { icpConfigId: string | null; version: number } | null
}

export interface Run {
  id: string | null
  _id?: string
  title: string
  source: string
  status: "active" | "completed" | "paused" | "cancelled"
  runStartedAt: string
  runEndedAt: string | null
  stats: RunStats
  runConfig: RunConfig
  createdAt: string | null
  updatedAt: string | null
}

export interface RunJob {
  _id: string
  runId: string
  title: string
  company: string
  location: string
  boardName: string
  externalId: string
  companyId: string | null
  industry?: string
  prospectCount?: number
  outreachCount?: number
  postedDate?: string
  qualityStatus: "excellent" | "good" | "fair" | "poor"
  rejectionReason: string | null
  jobDetails: {
    jobUrl: string
    companyUrl: string
    searchKeyword: string
    searchLocation: string
    description: string
    [key: string]: unknown
  }
  createdAt: string
  updatedAt: string
}

export interface JobProspect {
  _id: string
  runId?: string
  companyId?: string
  firstName: string
  lastName: string
  email?: string
  title?: string
  seniority?: string
  industryName?: string
  isEnriched: boolean
  isAccepted: boolean
  matchReasons?: string[]
  rejectionReason?: string | null
  prospectDetails?: {
    linkedinUrl?: string
    phone?: string
    location?: string
  }
}

export interface EnrichmentCreditStatus {
  creditsUsed: number
  dailyLimit: number
  creditsRemaining: number
  perJobLimit: number
  jobCredits: Record<string, number>
  periodEnd: string
}

export interface AllJobsResponse {
  total: number
  page: number
  limit: number
  pages: number
  jobs: RunJob[]
}

export interface RunJobsResponse {
  total: number
  page: number
  limit: number
  pages: number
  jobs: RunJob[]
}

export async function fetchRuns(page = 1, limit = 10): Promise<Run[]> {
  const res = await fetch(`${API_BASE}/api/v1/runs?page=${page}&limit=${limit}`)
  if (!res.ok) throw new Error("Failed to fetch runs")
  return res.json()
}

export async function fetchRun(id: string): Promise<Run> {
  const res = await fetch(`${API_BASE}/api/v1/runs/${id}`)
  if (!res.ok) throw new Error("Failed to fetch run")
  return res.json()
}

export async function deleteRun(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/v1/runs/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete run")
  return res.json()
}

// ── Analytics ────────────────────────────────────────────────────────────

export interface JobsAnalytics {
  days: number
  summary: { total: number; accepted: number; rejected: number; acceptanceRate: number }
  byBoard: { board: string; count: number }[]
  byQuality: { status: string; count: number }[]
  byRejectionReason: { reason: string; count: number }[]
  byKeyword: { keyword: string; count: number }[]
  byLocation: { location: string; count: number }[]
  dailyTrend: { date: string; total: number; accepted: number; rejected: number }[]
}

export interface CompaniesAnalytics {
  summary: { total: number; accepted: number; rejected: number; acceptanceRate: number; avgEmployees: number }
  byEligibility: { status: string; count: number }[]
  byIndustry: { industry: string; count: number }[]
  byRejectionReason: { reason: string; count: number }[]
  bySize: { range: string; count: number }[]
}

export async function fetchJobsAnalytics(days = 7): Promise<JobsAnalytics> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/jobs?days=${days}`)
  if (!res.ok) throw new Error("Failed to fetch jobs analytics")
  return res.json()
}

export async function fetchCompaniesAnalytics(): Promise<CompaniesAnalytics> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/companies`)
  if (!res.ok) throw new Error("Failed to fetch companies analytics")
  return res.json()
}

export async function fetchRunJobs(
  runId: string,
  page = 1,
  limit = 20,
  quality?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<RunJobsResponse> {
  let url = `${API_BASE}/api/v1/runs/${runId}/jobs?page=${page}&limit=${limit}`
  if (quality) url += `&quality=${quality}`
  if (sortBy) url += `&sort_by=${sortBy}`
  if (sortOrder) url += `&sort_order=${sortOrder}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch run jobs")
  return res.json()
}

// ── All Jobs ─────────────────────────────────────────────────────────────

export async function fetchJobProspects(
  jobId: string
): Promise<{ prospects: JobProspect[]; emailTemplate: any }> {
  const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}/prospects`)
  if (!res.ok) throw new Error("Failed to fetch prospects")
  return res.json()
}

export async function fetchEnrichmentCredits(
  runId: string
): Promise<EnrichmentCreditStatus> {
  const res = await fetch(`${API_BASE}/api/v1/runs/${runId}/enrichment-credits`)
  if (!res.ok) throw new Error("Failed to fetch credits")
  return res.json()
}

export async function fetchOutreachStatus(runId: string): Promise<{ records: any[] }> {
  const res = await fetch(`${API_BASE}/api/v1/runs/${runId}/outreach-status`)
  if (!res.ok) throw new Error("Failed to fetch outreach status")
  return res.json()
}

export async function triggerEmailFlow(
  runId: string,
  jobsPayload: { jobId: string; prospects: any[] }[]
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/runs/${runId}/trigger-email-flow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobs: jobsPayload }),
  })
  if (!res.ok) throw new Error("Failed to trigger email flow")
  return res.json()
}

export async function enrichProspects(
  prospectIds: string[],
  runId: string,
  jobId?: string
): Promise<{ message?: string; skippedNoCredit?: number }> {
  // Stub — enrichment not enabled in this iteration.
  return {
    message: "Enrichment is not enabled in this iteration",
    skippedNoCredit: prospectIds.length,
  }
}

export async function fetchAllJobs(
  page = 1,
  limit = 50,
  sortBy?: string,
  sortOrder?: string
): Promise<AllJobsResponse> {
  let url = `${API_BASE}/api/v1/jobs?page=${page}&limit=${limit}`
  if (sortBy) url += `&sort_by=${sortBy}`
  if (sortOrder) url += `&sort_order=${sortOrder}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch jobs")
  return res.json()
}
