"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Search,
  Building2,
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
}

type JobFilter = "all" | "good" | "poor"

export function RunResultsContent({ runId }: RunResultsContentProps) {
  const router = useRouter()
  const [run, setRun] = useState<Run | null>(null)
  const [jobsResp, setJobsResp] = useState<RunJobsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobPage, setJobPage] = useState(1)
  const [jobFilter, setJobFilter] = useState<JobFilter>("all")
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())

  const [prospectsPanelOpen, setProspectsPanelOpen] = useState(false)
  const [selectedJobForProspects, setSelectedJobForProspects] = useState<{
    id: string
    title: string
    company: string
  } | null>(null)

  const [outreachStatusOpen, setOutreachStatusOpen] = useState(false)
  const [creditStatus, setCreditStatus] = useState<EnrichmentCreditStatus | null>(null)

  const [sortField, setSortField] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "group">("asc")

  const loadRun = useCallback(async () => {
    try {
      setRun(await fetchRun(runId))
    } catch (e) {
      console.error(e)
    }
  }, [runId])

  const loadJobs = useCallback(async () => {
    try {
      const quality = jobFilter === "all" ? undefined : jobFilter
      setJobsResp(await fetchRunJobs(runId, jobPage, rowsPerPage, quality))
    } catch (e) {
      console.error(e)
    }
  }, [runId, jobPage, jobFilter, rowsPerPage])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadRun(), loadJobs()]).finally(() => setLoading(false))
  }, [loadRun, loadJobs])

  useEffect(() => {
    fetchEnrichmentCredits(runId)
      .then(setCreditStatus)
      .catch((e) => console.error("credits:", e))
  }, [runId])

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
      const get = (j: any) => (j[sortField] || "").toString().toLowerCase()
      const va = get(a)
      const vb = get(b)
      if (sortOrder === "asc" || sortOrder === "group") return va > vb ? 1 : va < vb ? -1 : 0
      return va < vb ? 1 : va > vb ? -1 : 0
    })
  }

  const handleSelectJob = (jobId: string) => {
    const next = new Set(selectedJobs)
    if (next.has(jobId)) next.delete(jobId)
    else next.add(jobId)
    setSelectedJobs(next)
  }
  const handleSelectAll = () => {
    if (!jobsResp?.jobs?.length) return
    if (selectedJobs.size === jobsResp.jobs.length) setSelectedJobs(new Set())
    else setSelectedJobs(new Set(jobsResp.jobs.map((j) => j._id)))
  }

  const handleFindProspects = (job: RunJob) => {
    setSelectedJobForProspects({ id: job._id, title: job.title, company: job.company })
    setProspectsPanelOpen(true)
  }

  const handleTriggerEmailFlow = () => {
    alert("Email outreach is not enabled in this iteration.")
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

  if (loading && !run) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0061ff]" />
      </div>
    )
  }

  const allJobs = jobsResp?.jobs ?? []
  const jobs = getSortedJobs(allJobs)
  const totalJobs = jobsResp?.total ?? 0
  const totalPages = jobsResp?.pages ?? 1
  const startRow = (jobPage - 1) * rowsPerPage + 1
  const endRow = Math.min(jobPage * rowsPerPage, totalJobs)

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    if (sortOrder === "asc") return <ArrowUp className="w-3 h-3 ml-1 text-[#0061ff]" />
    if (sortOrder === "desc") return <ArrowDown className="w-3 h-3 ml-1 text-[#0061ff]" />
    return <ListFilter className="w-3 h-3 ml-1 text-[#0061ff]" />
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      <header className="bg-white px-6 py-4 border-b border-[#e0e3e5]/20 shrink-0">
        <button
          onClick={() => router.push(`/runs/${runId}`)}
          className="flex items-center gap-2 text-sm text-[#565e74] hover:text-[#191c1e] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Run Details
        </button>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#191c1e]">{run?.title || "Run"} — Results</h1>
            <p
              className="text-xs text-[#737687] truncate"
              title={`${run?.runConfig.searchTitles.join(", ")} · ${run?.runConfig.searchLocations.join(", ")}`}
            >
              {run?.runConfig.searchTitles.join(", ")} ·{" "}
              {run?.runConfig.searchLocations.join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {run && (
              <Badge className="bg-blue-100 text-blue-700 border-0">{run.status}</Badge>
            )}
            {creditStatus && (() => {
              const used = creditStatus.creditsUsed
              const limit = creditStatus.dailyLimit
              const pct = limit > 0 ? Math.round((used / limit) * 100) : 0
              return (
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border shadow-sm text-xs font-bold bg-emerald-50 border-emerald-200 text-emerald-700">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span>
                    {used}/{limit} credits
                  </span>
                </div>
              )
            })()}
            <button
              onClick={handleTriggerEmailFlow}
              className="px-4 py-2 bg-[#004bca] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Trigger Email Flow
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

      <section className="bg-white px-6 py-3 border-b border-[#e0e3e5]/10 flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex gap-1 p-1 bg-[#f2f4f6] rounded-lg mr-4">
          {(["all", "good", "poor"] as JobFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => {
                setJobFilter(f)
                setJobPage(1)
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
          <span className="font-bold text-[#191c1e]">{totalJobs}</span> total jobs
        </div>
      </section>

      <section className="flex-1 overflow-auto bg-white relative">
        {jobs.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#0061ff]" />
            ) : (
              <div className="text-center">
                <Search className="w-10 h-10 text-[#94a3b8] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#191c1e] mb-1">No jobs found</h3>
                <p className="text-sm text-[#565e74]">No jobs match the current filter.</p>
              </div>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="bg-slate-50 border-b border-[#c2c6d9]/20">
                <th className="px-4 py-3 w-10">
                  <Checkbox
                    checked={selectedJobs.size === jobs.length && jobs.length > 0}
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
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider min-w-[160px] cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("company")}
                >
                  <div className="flex items-center">
                    Company
                    <SortIcon field="company" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider min-w-[140px] cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("industry")}
                >
                  <div className="flex items-center">
                    Industry
                    <SortIcon field="industry" />
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
                  </div>
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider w-32">
                  Outreach
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
                      className="font-bold text-[#004bca] text-xs truncate max-w-[200px] block hover:underline"
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
                      className="flex items-center gap-2 hover:underline cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                      title={job.company}
                    >
                      <div className="w-6 h-6 rounded-md bg-[#eceef0] flex items-center justify-center shrink-0">
                        <Building2 className="w-3 h-3 text-[#424656]" />
                      </div>
                      <span className="font-medium text-xs truncate max-w-[100px] text-[#004bca]">
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
                      {formatDate(job.postedDate || job.createdAt)}
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
                      {job.prospectCount !== undefined && job.prospectCount > 0
                        ? `${job.prospectCount} Prospects`
                        : "Prospects"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

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
      />

      <OutreachStatusPanel
        isOpen={outreachStatusOpen}
        runId={runId}
        onClose={() => setOutreachStatusOpen(false)}
      />
    </div>
  )
}
