"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Search,
  Building2,
  Eye,
  EyeOff,
  Activity,
  ArrowUp,
  ArrowDown,
  ListFilter,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  fetchRun,
  fetchRunJobs,
  triggerEmailFlow,
  fetchJobProspects,
  fetchEnrichmentCredits,
  type Run,
  type RunJob,
  type RunJobsResponse,
  type EnrichmentCreditStatus,
} from "@/lib/api"
import { JobProspectsPanel } from "./job-prospects-panel"

import { OutreachStatusPanel } from "./outreach-status-panel"

interface RunResultsContentProps {
  runId: string
  onNavigate?: (view: string) => void
}

type JobFilter = "all" | "good" | "poor"

export function RunResultsContent({ runId, onNavigate }: RunResultsContentProps) {
  const router = useRouter()
  const [run, setRun] = useState<Run | null>(null)
  
  const navigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view)
    } else {
      router.push(`/hr-assistant/${view}`)
    }
  }

  const [jobsResp, setJobsResp] = useState<RunJobsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobPage, setJobPage] = useState(1)
  const [jobFilter, setJobFilter] = useState<JobFilter>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`hr-run-tab-${runId}`)
      if (saved === "good" || saved === "poor") return saved
    }
    return "all"
  })
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`hr-run-selected-jobs-${runId}`)
      if (saved) {
        try { return new Set(JSON.parse(saved)) } catch { return new Set() }
      }
    }
    return new Set()
  })
  const [selectedProspects, setSelectedProspects] = useState<Record<string, Set<string>>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`hr-run-selected-prospects-${runId}`)
      if (saved) {
        try {
          const raw = JSON.parse(saved) as Record<string, string[]>
          const result: Record<string, Set<string>> = {}
          for (const [k, v] of Object.entries(raw)) {
            result[k] = new Set(Array.isArray(v) ? v : [])
          }
          return result
        } catch { return {} }
      }
    }
    return {}
  })
  const [isTriggeringEmailFlow, setIsTriggeringEmailFlow] = useState(false)
  const [prospectsData, setProspectsData] = useState<Record<string, any[]>>({})
  const [showJobsWithoutProspects, setShowJobsWithoutProspects] = useState(false)

  // Prospects panel state
  const [prospectsPanelOpen, setProspectsPanelOpen] = useState(false)
  const [selectedJobForProspects, setSelectedJobForProspects] = useState<{
    id: string
    title: string
    company: string
  } | null>(null)

  // Outreach status panel state
  const [outreachStatusOpen, setOutreachStatusOpen] = useState(false)

  // Post-email-flow polling: auto-refresh the table after triggering email flow
  const [isPollingOutreach, setIsPollingOutreach] = useState(false)
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pollingEndRef = useRef<number>(0)

  // Credit status
  const [creditStatus, setCreditStatus] = useState<EnrichmentCreditStatus | null>(null)

  // ── Persistence helpers ──────────────────────────────────────────
  const persistJobs = (jobs: Set<string>) => {
    localStorage.setItem(`hr-run-selected-jobs-${runId}`, JSON.stringify([...jobs]))
  }
  const persistProspects = (prospects: Record<string, Set<string>>) => {
    const serializable: Record<string, string[]> = {}
    for (const [k, v] of Object.entries(prospects)) {
      serializable[k] = [...(v instanceof Set ? v : new Set(Array.isArray(v) ? v : []))]
    }
    localStorage.setItem(`hr-run-selected-prospects-${runId}`, JSON.stringify(serializable))
  }
  const persistJobProspects = (jobId: string, ids: Set<string>) => {
    localStorage.setItem(`hr-run-selected-prospects-${runId}-${jobId}`, JSON.stringify([...ids]))
  }

  // ── Prospect count (handles both Set and Array from stale state) ──
  const getProspectCount = (v: Set<string> | string[] | undefined): number => {
    if (!v) return 0
    if (v instanceof Set) return v.size
    if (Array.isArray(v)) return v.length
    return 0
  }

  // ── Job checkbox toggled ─────────────────────────────────────────
  const handleSelectJob = (jobId: string) => {
    const wasSelected = selectedJobs.has(jobId)

    if (wasSelected) {
      // DESELECT job → clear all its prospects
      const nextJobs = new Set(selectedJobs)
      nextJobs.delete(jobId)
      setSelectedJobs(nextJobs)
      persistJobs(nextJobs)

      const emptySet = new Set<string>()
      setSelectedProspects(prev => {
        const next = { ...prev, [jobId]: emptySet }
        persistProspects(next)
        return next
      })
      persistJobProspects(jobId, emptySet)
    } else {
      // SELECT job → fetch and select ALL prospects
      const nextJobs = new Set(selectedJobs)
      nextJobs.add(jobId)
      setSelectedJobs(nextJobs)
      persistJobs(nextJobs)

      fetchJobProspects(jobId).then(data => {
        if (data?.prospects) {
          const ids = new Set(data.prospects.map((p: any) => p._id))
          setSelectedProspects(prev => {
            const next = { ...prev, [jobId]: ids }
            persistProspects(next)
            return next
          })
          setProspectsData(prev => ({ ...prev, [jobId]: data.prospects }))
          persistJobProspects(jobId, ids)
        }
      }).catch(err => {
        console.error("Failed to fetch prospects for job:", err)
      })
    }
  }

  // ── Header "Select All" checkbox ─────────────────────────────────
  const handleSelectAll = () => {
    if (!jobsResp?.jobs?.length) return
    const allSelected = selectedJobs.size === jobsResp.jobs.length

    if (allSelected) {
      // DESELECT all jobs + all prospects
      setSelectedJobs(new Set())
      persistJobs(new Set())

      const cleared: Record<string, Set<string>> = {}
      jobsResp.jobs.forEach(j => {
        cleared[j._id] = new Set()
        persistJobProspects(j._id, new Set())
      })
      setSelectedProspects(prev => ({ ...prev, ...cleared }))
      persistProspects({ ...selectedProspects, ...cleared })
    } else {
      // SELECT all jobs + fetch all prospects
      const allIds = jobsResp.jobs.map(j => j._id)
      const nextJobs = new Set(allIds)
      setSelectedJobs(nextJobs)
      persistJobs(nextJobs)

      Promise.all(jobsResp.jobs.map(j => fetchJobProspects(j._id).catch(() => null)))
        .then(results => {
          const nextP = { ...selectedProspects }
          const nextD = { ...prospectsData }
          results.forEach((data, i) => {
            if (data?.prospects) {
              const jid = jobsResp.jobs[i]._id
              const ids = new Set(data.prospects.map((p: any) => p._id))
              nextP[jid] = ids
              nextD[jid] = data.prospects
              persistJobProspects(jid, ids)
            }
          })
          setSelectedProspects(nextP)
          setProspectsData(nextD)
          persistProspects(nextP)
        })
    }
  }

  // ── Callback from JobProspectsPanel when prospects are toggled ────
  const handleProspectsSelected = (jobId: string, prospectIds: string[], prospectsDataList: any[]) => {
    const newSet = new Set(prospectIds)

    // Update prospects state
    setSelectedProspects(prev => {
      const next = { ...prev, [jobId]: newSet }
      persistProspects(next)
      return next
    })
    setProspectsData(prev => ({ ...prev, [jobId]: prospectsDataList }))
    persistJobProspects(jobId, newSet)

    // Bidirectional sync: auto-select or auto-deselect the job
    if (prospectIds.length > 0 && !selectedJobs.has(jobId)) {
      // Prospect selected → auto-check the job
      const nextJobs = new Set(selectedJobs)
      nextJobs.add(jobId)
      setSelectedJobs(nextJobs)
      persistJobs(nextJobs)
    } else if (prospectIds.length === 0 && selectedJobs.has(jobId)) {
      // All prospects removed → auto-uncheck the job
      const nextJobs = new Set(selectedJobs)
      nextJobs.delete(jobId)
      setSelectedJobs(nextJobs)
      persistJobs(nextJobs)
    }
  }

  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "group">("asc")

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortOrder === "asc") setSortOrder("desc")
      else if (sortOrder === "desc") setSortOrder("group")
      else {
        setSortField(null)
        setSortOrder("asc")
      }
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortedJobs = (jobsList: RunJob[]) => {
    if (!sortField) return jobsList

    return [...jobsList].sort((a, b) => {
      let valA: any = ""
      let valB: any = ""

      switch (sortField) {
        case "title":
          valA = a.title?.toLowerCase() || ""
          valB = b.title?.toLowerCase() || ""
          break
        case "company":
          valA = a.company?.toLowerCase() || ""
          valB = b.company?.toLowerCase() || ""
          break
        case "industry":
          valA = a.industry?.toLowerCase() || ""
          valB = b.industry?.toLowerCase() || ""
          break
        case "location":
          valA = a.location?.toLowerCase() || ""
          valB = b.location?.toLowerCase() || ""
          break
        case "outreach":
          valA = a.outreachCount || 0
          valB = b.outreachCount || 0
          break
      }

      if (sortOrder === "asc" || sortOrder === "group") {
        return valA > valB ? 1 : valA < valB ? -1 : 0
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0
      }
    })
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } catch {
      return dateStr
    }
  }

  const loadRun = useCallback(async () => {
    try {
      const data = await fetchRun(runId)
      setRun(data)
    } catch (e) {
      console.error(e)
    }
  }, [runId])

  const loadJobs = useCallback(async () => {
    try {
      const quality = jobFilter === "all" ? undefined : jobFilter
      const data = await fetchRunJobs(runId, jobPage, rowsPerPage, quality)
      setJobsResp(data)
    } catch (e) {
      console.error(e)
    }
  }, [runId, jobPage, jobFilter, rowsPerPage])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadRun(), loadJobs()]).finally(() => setLoading(false))
  }, [loadRun, loadJobs])

  const refreshCredits = useCallback(() => {
    if (!runId) return
    fetchEnrichmentCredits(runId)
      .then(data => setCreditStatus(data))
      .catch(e => console.error("Failed to load credits:", e))
  }, [runId])

  // Load credit status
  useEffect(() => {
    refreshCredits()
  }, [refreshCredits])

  // ── Auto-refresh jobs when polling outreach (after email trigger or panel open) ──
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isPollingOutreach || outreachStatusOpen) {
      // Poll every 3 seconds for fast updates
      interval = setInterval(() => {
        loadJobs()
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPollingOutreach, outreachStatusOpen, loadJobs])

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current)
    }
  }, [])

  const handleFindProspects = (job: RunJob) => {
    setSelectedJobForProspects({
      id: job._id,
      title: job.title,
      company: job.company,
    })
    setProspectsPanelOpen(true)
  }

  const handleTriggerEmailFlow = async () => {
    if (selectedJobs.size === 0) {
      alert("Please select at least one job")
      return
    }

    setIsTriggeringEmailFlow(true)
    try {
      const jobsPayload: { jobId: string; prospects: any[] }[] = []
      let totalProspectCount = 0

      for (const jobId of selectedJobs) {
        const jobProspectIds = selectedProspects[jobId]
        const prospectIdList = jobProspectIds instanceof Set
          ? [...jobProspectIds]
          : Array.isArray(jobProspectIds) ? jobProspectIds : []

        if (prospectIdList.length === 0) continue

        const job = jobsResp?.jobs.find(j => j._id === jobId)
        if (!job) continue

        const jobProspectsData = prospectsData[jobId] || []

        const prospects: any[] = []
        for (const prospectId of prospectIdList) {
          const prospectData = jobProspectsData.find((p: any) => p._id === prospectId)
          if (prospectData) {
            prospects.push({
              prospectId,
              companyId: job.companyId || "",
              firstName: prospectData.firstName || "",
              email: prospectData.email || "",
              industrySlug: prospectData.industrySlug || "",
              title: prospectData.title || "",
              companyName: job.company || "",
              jobTitle: job.title || "",
            })
          }
        }

        if (prospects.length > 0) {
          jobsPayload.push({ jobId, prospects })
          totalProspectCount += prospects.length
        }
      }

      if (jobsPayload.length === 0 || totalProspectCount === 0) {
        alert("Please select at least one prospect to trigger the email flow")
        setIsTriggeringEmailFlow(false)
        return
      }

      const result = await triggerEmailFlow(runId, jobsPayload)
      console.log(
        result.message ||
        `Email flow triggered for ${totalProspectCount} prospects across ${jobsPayload.length} job(s)`
      )
      
      // Open the status panel
      setOutreachStatusOpen(true)

      // Start polling the table for outreach status updates (60 seconds)
      setIsPollingOutreach(true)
      pollingEndRef.current = Date.now() + 60_000
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current)
      pollingTimerRef.current = setTimeout(() => {
        setIsPollingOutreach(false)
      }, 60_000)

      // Immediately refresh jobs to show the "Pending" → "Sent" transition
      loadJobs()

      // AUTO UNSELECT: Clear all selections to help user work fast
      // Clear individual job prospects from localStorage
      for (const jid of selectedJobs) {
        localStorage.removeItem(`hr-run-selected-prospects-${runId}-${jid}`)
      }
      
      setSelectedJobs(new Set())
      persistJobs(new Set())
      setSelectedProspects({})
      persistProspects({})
      
    } catch (error: any) {
      console.error("Error triggering email flow:", error)
      alert(`Error triggering email flow: ${error.message || "Unknown error"}`)
    } finally {
      setIsTriggeringEmailFlow(false)
    }
  }

  if (loading && !run) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0061ff]" />
      </div>
    )
  }

  const allJobs = jobsResp?.jobs ?? []
  const totalJobs = jobsResp?.total ?? 0
  const totalPages = jobsResp?.pages ?? 1
  const startRow = (jobPage - 1) * rowsPerPage + 1
  const endRow = Math.min(jobPage * rowsPerPage, totalJobs)
  let totalSelectedProspectsCount = 0
  selectedJobs.forEach((jobId) => {
    totalSelectedProspectsCount += getProspectCount(selectedProspects[jobId])
  })

  // Split jobs: those WITH prospects first, those WITHOUT hidden by default
  // But if NO jobs have prospects (e.g. Phase 3 hasn't been run yet), show all jobs
  const jobsWithProspects = allJobs.filter(
    (job) => (job as any).prospectCount !== undefined && (job as any).prospectCount > 0
  )
  const jobsWithoutProspects = allJobs.filter(
    (job) => (job as any).prospectCount === undefined || (job as any).prospectCount === 0
  )
  const hasAnyProspects = jobsWithProspects.length > 0
  // Visible jobs: if no jobs have prospects yet, show all jobs.
  // Otherwise, show with-prospects first and conditionally show without.
  const baseJobs = hasAnyProspects
    ? [
        ...jobsWithProspects,
        ...(showJobsWithoutProspects ? jobsWithoutProspects : []),
      ]
    : allJobs

  const jobs = getSortedJobs(baseJobs)

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    if (sortOrder === "asc") return <ArrowUp className="w-3 h-3 ml-1 text-[#0061ff]" />
    if (sortOrder === "desc") return <ArrowDown className="w-3 h-3 ml-1 text-[#0061ff]" />
    return <ListFilter className="w-3 h-3 ml-1 text-[#0061ff]" />
  }

  const SortLabel = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return (
      <span className="ml-1.5 text-[8px] font-black text-[#0061ff] bg-blue-50 px-1 py-0.5 rounded uppercase">
        {sortOrder === "asc" ? "A-Z" : sortOrder === "desc" ? "Z-A" : "Group"}
      </span>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Header Section ── */}
      <header className="bg-white px-6 py-4 border-b border-[#e0e3e5]/20 shrink-0">
        <button
          onClick={() => navigate(`runs/${runId}`)}
          className="flex items-center gap-2 text-sm text-[#565e74] hover:text-[#191c1e] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Run Details
        </button>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="page-heading !text-xl">
              {run?.title || "Run"} — Results
            </h1>
            <p 
              className="page-subtitle truncate" 
              title={`${run?.runConfig.searchTitles.join(", ")} · ${run?.runConfig.searchLocations.join(", ")}`}
            >
              {run?.runConfig.searchTitles.join(", ")} ·{" "}
              {run?.runConfig.searchLocations.join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {run && (
              <Badge className="bg-blue-100 text-blue-700 border-0">
                {run.status}
              </Badge>
            )}

            {/* Credit Status Pill */}
            {creditStatus && (() => {
              const used = creditStatus.creditsUsed
              const limit = creditStatus.dailyLimit
              const remaining = creditStatus.creditsRemaining
              const pct = limit > 0 ? Math.round((used / limit) * 100) : 0
              const isFull = remaining <= 0
              return (
                <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border shadow-sm text-xs font-bold ${
                  isFull 
                    ? 'bg-red-50 border-red-200 text-red-700' 
                    : pct > 66 
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-red-500' : pct > 66 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span>{used}/{limit} credits</span>
                </div>
              )
            })()}

            <button
              onClick={handleTriggerEmailFlow}
              disabled={isTriggeringEmailFlow || selectedJobs.size === 0 || totalSelectedProspectsCount === 0}
              className="px-4 py-2 bg-[#004bca] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isTriggeringEmailFlow ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              Trigger Email Flow {totalSelectedProspectsCount > 0 ? `(${totalSelectedProspectsCount})` : ""}
            </button>
            <button
              onClick={() => setOutreachStatusOpen(true)}
              className="px-4 py-2 bg-white border border-[#e0e3e5] text-[#191c1e] text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-[#0061ff]" />
              Check Status
            </button>
          </div>
        </div>
      </header>

      {/* ── Filter Bar ── */}
      <section className="bg-white px-6 py-3 border-b border-[#e0e3e5]/10 flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex gap-1 p-1 bg-[#f2f4f6] rounded-lg mr-4">
          {(["all", "good", "poor"] as JobFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => {
                setJobFilter(f)
                setJobPage(1)
                sessionStorage.setItem(`hr-run-tab-${runId}`, f)
              }}
              className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                jobFilter === f
                  ? "bg-white text-[#004bca] shadow-sm border border-[#c2c6d9]/10"
                  : "text-[#737687] hover:text-[#191c1e]"
              }`}
            >
              {f === "all" ? "All Jobs" : f === "good" ? "Accepted" : "Rejected"}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="text-xs text-[#737687] font-medium">
          <span className="font-bold text-[#191c1e]">{totalJobs}</span> total
          jobs
        </div>
      </section>

      {/* ── Results Table ── */}
      <section className="flex-1 overflow-auto bg-white relative">
        {jobs.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#0061ff]" />
            ) : (
              <div className="text-center">
                <Search className="w-10 h-10 text-[#94a3b8] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#191c1e] mb-1">
                  No jobs found
                </h3>
                <p className="text-sm text-[#565e74]">
                  No jobs match the current filter.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="bg-slate-50 border-b border-[#c2c6d9]/20">
                <th className="px-4 py-3 w-10">
                  <Checkbox
                    checked={
                      selectedJobs.size === jobs.length && jobs.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th 
                  className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider min-w-[200px] cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center">
                    Job Title
                    <SortIcon field="title" />
                    <SortLabel field="title" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider min-w-[160px] cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("company")}
                >
                  <div className="flex items-center">
                    Company
                    <SortIcon field="company" />
                    <SortLabel field="company" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider min-w-[140px] cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("industry")}
                >
                  <div className="flex items-center">
                    Industry
                    <SortIcon field="industry" />
                    <SortLabel field="industry" />
                  </div>
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider w-32">
                  Posted Date
                </th>
                <th 
                  className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider w-40 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("location")}
                >
                  <div className="flex items-center">
                    Location
                    <SortIcon field="location" />
                    <SortLabel field="location" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider w-32 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("outreach")}
                >
                  <div className="flex items-center">
                    Outreach Status
                    <SortIcon field="outreach" />
                    <SortLabel field="outreach" />
                  </div>
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider text-right w-36">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c2c6d9]/10">
              {jobs.map((job) => (
                <tr
                  key={job._id}
                  className={`hover:bg-[#004bca]/5 transition-colors group ${
                    selectedJobs.has(job._id) 
                      ? "bg-[#004bca]/10" 
                      : job.qualityStatus === "good"
                        ? "bg-emerald-50/40"
                        : "bg-red-50/40"
                  }`}
                >
                  <td className="px-4 py-2">
                    <Checkbox
                      checked={selectedJobs.has(job._id)}
                      onCheckedChange={() => handleSelectJob(job._id)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={job.jobDetails?.jobUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#004bca] text-xs truncate max-w-[200px] block hover:underline cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                      title={job.title}
                    >
                      {job.title}
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={job.jobDetails?.companyUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:underline cursor-pointer group/company"
                      onClick={(e) => e.stopPropagation()}
                      title={job.company}
                    >
                      <div className="w-6 h-6 rounded-md bg-[#eceef0] flex items-center justify-center shrink-0">
                        <Building2 className="w-3 h-3 text-[#424656]" />
                      </div>
                      <span className="font-medium text-xs truncate max-w-[100px] text-[#004bca] group-hover/company:underline">
                        {job.company}
                      </span>
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[10px] text-[#565e74] font-bold uppercase tracking-wider">
                      {job.industry || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-xs text-[#565e74] font-medium">
                      {formatDate(job.postedDate)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span 
                      className="inline-block bg-[#e6e8ea] px-2 py-0.5 rounded text-[10px] font-medium text-[#424656] max-w-[120px] truncate align-middle"
                      title={job.location || "Unknown"}
                    >
                      {job.location || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {job.outreachCount && job.outreachCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {job.outreachCount} Sent
                      </span>
                    ) : isPollingOutreach ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-amber-600 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Sending...
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#94a3b8] font-medium">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleFindProspects(job)}
                      className="text-[10px] font-bold bg-[#004bca] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                    >
                      <Users className="w-3 h-3" />
                      {job.prospectCount !== undefined 
                        ? `${job.prospectCount} Prospects` 
                        : "Prospects"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Toggle for jobs without prospects ── */}
          {jobsWithoutProspects.length > 0 && (
            <div className="px-6 py-4 border-t border-[#e0e3e5]/20 bg-[#fafbfc] text-center">
              <button
                onClick={() => setShowJobsWithoutProspects((prev) => !prev)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#004bca] hover:text-[#003199] hover:underline transition-colors"
              >
                {showJobsWithoutProspects ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    Hide {jobsWithoutProspects.length} job{jobsWithoutProspects.length !== 1 ? "s" : ""} without prospects
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Show {jobsWithoutProspects.length} job{jobsWithoutProspects.length !== 1 ? "s" : ""} without prospects
                  </>
                )}
              </button>
            </div>
          )}
          </>
        )}
      </section>

      {/* ── Sticky Pagination Footer ── */}
      {jobs.length > 0 && (
        <footer className="bg-white px-6 py-3 border-t border-[#e0e3e5]/20 flex justify-between items-center z-30 shrink-0">
          <div className="flex items-center gap-4 text-[11px] font-medium text-[#737687]">
            <span>Rows:</span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(v) => {
                setRowsPerPage(Number(v))
                setJobPage(1)
              }}
            >
              <SelectTrigger className="w-14 h-6 text-[11px] bg-transparent border-none p-0 font-bold text-[#191c1e]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-2 border-l border-[#c2c6d9]/30 pl-4">
              {startRow}-{endRow} of {totalJobs.toLocaleString()} results
            </span>
          </div>
          <div className="flex gap-1">
            <button
              className="p-1 rounded-lg hover:bg-[#e0e3e5] text-[#737687] disabled:opacity-30"
              disabled={jobPage === 1}
              onClick={() => setJobPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => setJobPage(page)}
                  className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all ${
                    jobPage === page
                      ? "bg-[#004bca] text-white shadow-sm"
                      : "hover:bg-[#e0e3e5] text-[#737687]"
                  }`}
                >
                  {page}
                </button>
              )
            })}
            {totalPages > 5 && (
              <span className="w-6 h-6 flex items-center justify-center text-[#737687] text-[10px]">
                ...
              </span>
            )}
            <button
              className="p-1 rounded-lg hover:bg-[#e0e3e5] text-[#737687] disabled:opacity-30"
              disabled={jobPage >= totalPages}
              onClick={() => setJobPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      )}

      {/* ── Prospects Slide Panel ── */}
      <JobProspectsPanel
        isOpen={prospectsPanelOpen}
        onClose={() => {
          setProspectsPanelOpen(false)
          setSelectedJobForProspects(null)
        }}
        jobId={selectedJobForProspects?.id || null}
        jobTitle={selectedJobForProspects?.title || ""}
        companyName={selectedJobForProspects?.company || ""}
        runId={runId}
        onProspectsSelected={handleProspectsSelected}
        onEnrichmentComplete={refreshCredits}
      />


      <OutreachStatusPanel 
        isOpen={outreachStatusOpen}
        runId={runId} 
        onClose={() => setOutreachStatusOpen(false)} 
      />
    </div>
  )
}
