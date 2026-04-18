"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  ListFilter,
  Sparkles,
  Users,
  Upload,
  Search,
  ShieldCheck,
  TrendingUp,
  FolderOpen,
  ArrowLeft,
  Building2,
  Briefcase,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchRun, fetchRunJobs, type Run, type RunJob, type RunJobsResponse } from "@/lib/api"

interface RunDetailContentProps {
  runId: string
}

type JobFilter = "all" | "good" | "poor"

export function RunDetailContent({ runId }: RunDetailContentProps) {
  const router = useRouter()
  const [run, setRun] = useState<Run | null>(null)
  const [jobsResp, setJobsResp] = useState<RunJobsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobPage, setJobPage] = useState(1)
  const [jobFilter, setJobFilter] = useState<JobFilter>("all")
  const jobLimit = 20

  const loadRun = useCallback(async () => {
    try {
      const data = await fetchRun(runId)
      setRun(data)
    } catch (e) { console.error(e) }
  }, [runId])

  const loadJobs = useCallback(async () => {
    try {
      const quality = jobFilter === "all" ? undefined : jobFilter
      const data = await fetchRunJobs(runId, jobPage, jobLimit, quality)
      setJobsResp(data)
    } catch (e) { console.error(e) }
  }, [runId, jobPage, jobFilter])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadRun(), loadJobs()]).finally(() => setLoading(false))
  }, [loadRun, loadJobs])

  // Auto-refresh if run is active
  useEffect(() => {
    if (!run || run.status !== "active") return
    const id = setInterval(() => { loadRun(); loadJobs() }, 6000)
    return () => clearInterval(id)
  }, [run, loadRun, loadJobs])

  if (loading && !run) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0061ff]" />
      </div>
    )
  }

  if (!run) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-[#565e74]">Run not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/search-history")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Runs
        </Button>
      </div>
    )
  }

  const stats = run.stats
  const isActive = run.status === "active"
  const isCompleted = run.status === "completed"
  const isCancelled = run.status === "cancelled"

  // Pipeline steps
  const steps = [
    {
      id: 1,
      name: "Scraping Jobs",
      status: (stats.totalJobsScraped > 0 || isCompleted || isCancelled) ? "completed" : isActive ? "active" : "pending",
    },
    {
      id: 2,
      name: "Title Rejection",
      status: (stats.acceptedJobs !== undefined && stats.acceptedJobs > 0) || isCompleted || isCancelled ? "completed" : isActive ? "active" : "pending",
    },
    {
      id: 3,
      name: "Company Enrichment",
      status: (stats.uniqueCompanies ?? 0) > 0 || isCompleted ? "completed" : isActive ? "active" : "pending",
    },
    {
      id: 4,
      name: "Company Rejection",
      status: isCompleted ? "completed" : (stats.uniqueCompanies ?? 0) > 0 && isActive ? "active" : "pending",
    },
    {
      id: 5,
      name: "Done",
      status: isCompleted ? "completed" : "pending",
    },
  ]

  const getStepIcon = (step: typeof steps[0]) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-white" />
      case "active":
        return <ListFilter className="w-5 h-5 text-[#0061ff]" />
      default:
        switch (step.id) {
          case 3: return <Building2 className="w-5 h-5 text-[#565e74]" />
          case 4: return <ShieldCheck className="w-5 h-5 text-[#565e74]" />
          case 5: return <Upload className="w-5 h-5 text-[#565e74]" />
          default: return <Search className="w-5 h-5 text-[#565e74]" />
        }
    }
  }

  const statusBadge = () => {
    if (isActive) return <Badge className="bg-emerald-100 text-emerald-700 border-0">Active</Badge>
    if (isCompleted) return <Badge className="bg-blue-100 text-blue-700 border-0">Completed</Badge>
    if (isCancelled) return <Badge className="bg-red-100 text-red-700 border-0">Cancelled</Badge>
    return <Badge variant="secondary">{run.status}</Badge>
  }

  // Compute progress %
  const completedSteps = steps.filter((s) => s.status === "completed").length
  const progress = Math.round((completedSteps / steps.length) * 100)

  const jobs = jobsResp?.jobs ?? []
  const totalJobs = jobsResp?.total ?? 0
  const totalPages = jobsResp?.pages ?? 1

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push("/search-history")}
          className="flex items-center gap-2 text-sm text-[#565e74] hover:text-[#191c1e] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Runs
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[#191c1e]">{run.title}</h1>
              {statusBadge()}
            </div>
            <div className="flex items-center gap-2 text-[#565e74]">
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm">
                {run.runConfig.searchTitles.join(", ")} &middot; {run.runConfig.searchLocations.join(", ")}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#0061ff] uppercase tracking-wider font-medium mb-1">Progress</p>
            <p className="text-2xl font-bold text-[#191c1e]">{progress}%</p>
            <div className="w-32 h-2 bg-[#e0e3e5] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#0061ff] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pipeline Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  step.status === "completed"
                    ? "bg-[#0061ff]"
                    : step.status === "active"
                      ? "border-2 border-[#0061ff] bg-white"
                      : "border border-[#e0e3e5] bg-white"
                }`}>
                  {getStepIcon(step)}
                </div>
                <p className={`mt-2 text-xs uppercase tracking-wider font-medium ${
                  step.status === "active" ? "text-[#0061ff]" : "text-[#565e74]"
                }`}>
                  {step.status === "active" ? "Active" : `Step ${step.id}`}
                </p>
                <p className={`text-sm font-medium ${
                  step.status === "pending" ? "text-[#94a3b8]" : "text-[#191c1e]"
                }`}>
                  {step.name}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step.status === "completed" ? "bg-[#0061ff]" : "bg-[#e0e3e5]"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-[#0061ff] font-medium">Jobs Scraped</p>
              <Search className="w-4 h-4 text-[#94a3b8]" />
            </div>
            <p className="text-3xl font-bold text-[#191c1e]">{stats.totalJobsScraped.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-2">
              {isActive ? (
                <>
                  <TrendingUp className="w-3 h-3 text-[#10b981]" />
                  <span className="text-xs text-[#10b981] font-medium">SCANNING LIVE</span>
                </>
              ) : (
                <span className="text-xs text-[#94a3b8] font-medium">{stats.inserted ?? 0} new, {stats.duplicates ?? 0} dupes</span>
              )}
            </div>
          </div>

          <div className={`bg-white rounded-xl p-5 ${isCompleted ? "border-2 border-[#0061ff]" : "border border-[#e0e3e5]"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-[#0061ff] font-medium">Jobs Accepted</p>
              <ShieldCheck className="w-4 h-4 text-[#0061ff]" />
            </div>
            <p className="text-3xl font-bold text-[#191c1e]">{stats.acceptedJobs ?? 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-red-500 font-medium">{stats.rejectedJobs ?? 0} rejected by title</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-[#565e74] font-medium">Companies</p>
              <Building2 className="w-4 h-4 text-[#94a3b8]" />
            </div>
            <p className="text-3xl font-bold text-[#191c1e]">{stats.uniqueCompanies ?? 0}</p>
            <p className="text-xs text-[#94a3b8] mt-2">
              <span className="text-emerald-600 font-medium">{stats.acceptedCompanies ?? 0}</span> accepted,{" "}
              <span className="text-red-500 font-medium">{stats.rejectedCompanies ?? 0}</span> rejected
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-[#565e74] font-medium">Skipped</p>
              <XCircle className="w-4 h-4 text-[#94a3b8]" />
            </div>
            <p className="text-3xl font-bold text-[#94a3b8]">{stats.skippedCompanies ?? 0}</p>
            <p className="text-xs text-[#94a3b8] mt-2">No LinkedIn data</p>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-[#e0e3e5] flex items-center justify-between">
            <h3 className="font-semibold text-[#191c1e]">Jobs ({totalJobs})</h3>
            <div className="flex items-center gap-1 bg-[#f2f4f6] p-1 rounded-lg">
              {(["all", "good", "poor"] as JobFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => { setJobFilter(f); setJobPage(1) }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    jobFilter === f
                      ? "bg-white shadow-sm text-[#004bca]"
                      : "text-[#424656] hover:bg-[#e6e8ea]"
                  }`}
                >
                  {f === "all" ? "All" : f === "good" ? "Accepted" : "Rejected"}
                </button>
              ))}
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#94a3b8]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "No jobs found for this filter."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f2f4f6]">
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Title</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Company</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Location</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Board</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Quality</th>
                      <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c2c6d9]/10">
                    {jobs.map((job) => (
                      <tr key={job._id} className="hover:bg-[#f2f4f6] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-[#191c1e]">{job.title}</span>
                            {job.jobDetails?.jobUrl && (
                              <a href={job.jobDetails.jobUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <ExternalLink className="w-3 h-3 text-[#94a3b8] hover:text-[#0061ff]" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#424656]">{job.company}</td>
                        <td className="px-6 py-4 text-sm text-[#424656]">{job.location}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f2f4f6] text-[#424656]">{job.boardName}</span>
                        </td>
                        <td className="px-6 py-4">
                          {job.qualityStatus === "good" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                              <CheckCircle className="w-3 h-3" /> Good
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500">
                              <XCircle className="w-3 h-3" /> Poor
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#737687] max-w-[200px] truncate">{job.rejectionReason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Jobs Pagination */}
              <div className="px-6 py-4 bg-[#f2f4f6] flex items-center justify-between">
                <div className="text-xs text-[#424656] font-medium">
                  Page <span className="font-mono">{jobPage}</span> of <span className="font-mono">{totalPages}</span>
                  {" "}({totalJobs} total)
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setJobPage((p) => Math.max(1, p - 1))}
                    disabled={jobPage <= 1}
                    className="p-1.5 rounded-lg hover:bg-[#e6e8ea] text-[#737687] disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#004bca] text-white">{jobPage}</span>
                  <button
                    onClick={() => setJobPage((p) => Math.min(totalPages, p + 1))}
                    disabled={jobPage >= totalPages}
                    className="p-1.5 rounded-lg hover:bg-[#e6e8ea] text-[#737687] disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
