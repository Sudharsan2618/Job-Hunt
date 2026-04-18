"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchRunJobs, type RunJob, type RunJobsResponse } from "@/lib/api"

interface RunResultsContentProps {
  runId: string
}

type SortField = "title" | "company" | "location" | "boardName" | "qualityStatus"
type SortOrder = "asc" | "desc" | null

export function RunResultsContent({ runId }: RunResultsContentProps) {
  const router = useRouter()
  const [jobsResp, setJobsResp] = useState<RunJobsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobPage, setJobPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const jobLimit = 50

  const loadJobs = useCallback(async () => {
    try {
      const sortBy = sortField === "createdAt" ? "createdAt" : sortField
      const data = await fetchRunJobs(runId, jobPage, jobLimit, undefined, sortBy, sortOrder || "desc")
      setJobsResp(data)
    } catch (e) {
      console.error(e)
    }
  }, [runId, jobPage, sortField, sortOrder])

  useEffect(() => {
    setLoading(true)
    loadJobs().finally(() => setLoading(false))
  }, [loadJobs])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle: asc -> desc -> null -> asc
      if (sortOrder === "asc") {
        setSortOrder("desc")
      } else if (sortOrder === "desc") {
        setSortOrder(null)
      } else {
        setSortOrder("asc")
      }
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setJobPage(1)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3" />
    if (sortOrder === "asc") return <ArrowUp className="w-3 h-3" />
    if (sortOrder === "desc") return <ArrowDown className="w-3 h-3" />
    return <ArrowUpDown className="w-3 h-3" />
  }

  const jobs = jobsResp?.jobs ?? []
  const totalJobs = jobsResp?.total ?? 0
  const totalPages = jobsResp?.pages ?? 1

  if (loading && !jobsResp) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0061ff]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Header */}
      <header className="bg-white px-6 py-4 border-b border-[#e0e3e5]/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/runs/${runId}`)}
            className="flex items-center gap-2 text-sm text-[#565e74] hover:text-[#191c1e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Run
          </button>
          <div>
            <h1 className="page-heading !text-xl">Run Results</h1>
            <p className="page-subtitle">Viewing all jobs from this run.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#565e74]">{totalJobs} jobs</span>
        </div>
      </header>

      {/* Results Table */}
      <section className="flex-1 overflow-auto bg-white relative">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-20 shadow-sm">
            <tr className="bg-slate-50 border-b border-[#c2c6d9]/20">
              <th
                className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider min-w-[200px] cursor-pointer hover:bg-[#f2f4f6] transition-colors"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-1">
                  Title
                  {getSortIcon("title")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider min-w-[160px] cursor-pointer hover:bg-[#f2f4f6] transition-colors"
                onClick={() => handleSort("company")}
              >
                <div className="flex items-center gap-1">
                  Company
                  {getSortIcon("company")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider w-40 cursor-pointer hover:bg-[#f2f4f6] transition-colors"
                onClick={() => handleSort("location")}
              >
                <div className="flex items-center gap-1">
                  Location
                  {getSortIcon("location")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider w-32 cursor-pointer hover:bg-[#f2f4f6] transition-colors"
                onClick={() => handleSort("boardName")}
              >
                <div className="flex items-center gap-1">
                  Job Board
                  {getSortIcon("boardName")}
                </div>
              </th>
              <th
                className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider w-24 cursor-pointer hover:bg-[#f2f4f6] transition-colors"
                onClick={() => handleSort("qualityStatus")}
              >
                <div className="flex items-center gap-1">
                  Quality
                  {getSortIcon("qualityStatus")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c2c6d9]/10">
            {jobs.map((job) => (
              <tr key={job._id} className="hover:bg-[#004bca]/5 transition-colors">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={job.jobDetails?.jobUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-xs text-[#004bca] hover:underline truncate max-w-[300px]"
                    >
                      {job.title}
                    </a>
                    {job.jobDetails?.jobUrl && (
                      <ExternalLink className="w-3 h-3 text-[#737687] flex-shrink-0" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {job.jobDetails?.companyUrl ? (
                      <a
                        href={job.jobDetails.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-xs text-[#004bca] hover:underline truncate max-w-[120px]"
                      >
                        {job.company}
                      </a>
                    ) : (
                      <span className="font-medium text-xs text-[#191c1e] truncate max-w-[120px]">
                        {job.company}
                      </span>
                    )}
                    {job.jobDetails?.companyUrl && (
                      <ExternalLink className="w-3 h-3 text-[#737687] flex-shrink-0" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className="bg-[#e6e8ea] px-2 py-0.5 rounded text-[10px] font-medium text-[#424656]">
                    {job.location}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f2f4f6] text-[#424656]">
                    {job.boardName}
                  </span>
                </td>
                <td className="px-4 py-2">
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
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Pagination Footer */}
      <footer className="bg-white px-6 py-3 border-t border-[#e0e3e5]/20 flex justify-between items-center z-30">
        <div className="flex items-center gap-4 text-[11px] font-medium text-[#737687]">
          <span className="ml-2">
            {jobPage}-{totalPages} of {totalJobs.toLocaleString()} results
          </span>
        </div>
        <div className="flex gap-1">
          <button
            className="p-1 rounded-lg hover:bg-[#e0e3e5] text-[#737687] disabled:opacity-30"
            disabled={jobPage <= 1}
            onClick={() => setJobPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-[#004bca] text-white">
            {jobPage}
          </span>
          <button
            className="p-1 rounded-lg hover:bg-[#e0e3e5] text-[#737687] disabled:opacity-30"
            disabled={jobPage >= totalPages}
            onClick={() => setJobPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  )
}
