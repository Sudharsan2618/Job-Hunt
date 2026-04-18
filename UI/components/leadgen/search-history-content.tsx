"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Briefcase,
  Building2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  Zap,
  History,
  Sparkles,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchRuns, type Run } from "@/lib/api"

type FilterTab = "all" | "completed" | "active"

const statusConfig: Record<string, { color: string; textColor: string; label: string }> = {
  active:    { color: "bg-emerald-500", textColor: "text-emerald-600", label: "Active" },
  completed: { color: "bg-[#004bca]",   textColor: "text-[#004bca]",   label: "Completed" },
  cancelled: { color: "bg-red-500",      textColor: "text-red-600",      label: "Cancelled" },
  paused:    { color: "bg-amber-500",    textColor: "text-amber-600",    label: "Paused" },
}

function fmtDate(d: string | null) {
  if (!d) return { date: "—", time: "" }
  const dt = new Date(d)
  return {
    date: dt.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }),
    time: dt.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }),
  }
}

export function SearchHistoryContent() {
  const router = useRouter()
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const limit = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchRuns(page, limit)
      setRuns(data)
      setHasMore(data.length === limit)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  // Auto-refresh while any run is active
  useEffect(() => {
    if (!runs.some((r) => r.status === "active")) return
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [runs, load])

  const filters: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All Runs" },
    { id: "completed", label: "Completed" },
    { id: "active", label: "Active" },
  ]

  const filteredRuns = runs.filter((r) => {
    if (activeFilter === "all") return true
    return r.status === activeFilter
  })

  // Aggregate stats
  const totalJobs = runs.reduce((s, r) => s + (r.stats.totalJobsScraped || 0), 0)
  const totalAccepted = runs.reduce((s, r) => s + (r.stats.acceptedCompanies || 0), 0)

  return (
    <div className="p-8 flex-1 max-w-7xl w-full mx-auto space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="page-heading">Runs</h2>
          <p className="page-subtitle">All scraping runs and their pipeline progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#f2f4f6] p-1 rounded-xl">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => { setActiveFilter(filter.id); setPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeFilter === filter.id
                    ? "bg-white shadow-sm text-[#004bca]"
                    : "text-[#424656] hover:bg-[#e6e8ea]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <Button
            onClick={() => router.push("/search")}
            className="gap-2 bg-[#0061ff] hover:bg-[#004bca] text-white"
          >
            <Plus className="w-4 h-4" />
            New Run
          </Button>
        </div>
      </div>

      {/* ── Summary Stats Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-surface p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <p className="stat-label flex items-center gap-2">
              <History className="w-3 h-3 text-[#004bca]" />
              Total Runs
            </p>
            <button onClick={load} className="p-1.5 bg-[#f2f4f6] rounded-full text-[#004bca] opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <p className="stat-value">{runs.length}</p>
          <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" />
            {runs.filter((r) => r.status === "active").length} active now
          </p>
        </div>

        <div className="card-surface p-6 group">
          <div className="flex justify-between items-start mb-2">
            <p className="stat-label flex items-center gap-2">
              <Briefcase className="w-3 h-3 text-[#6b21dc]" />
              Jobs Scraped
            </p>
          </div>
          <p className="stat-value text-[#191c1e]">{totalJobs.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-[#424656] mt-1">
            Across all runs
          </p>
        </div>

        <div className="card-surface p-6 group">
          <div className="flex justify-between items-start mb-2">
            <p className="stat-label flex items-center gap-2 text-[#737687]">
              Companies Accepted
            </p>
            <Building2 className="w-3 h-3 text-[#10b981]" />
          </div>
          <p className="stat-value">{totalAccepted}</p>
          <p className="text-[10px] font-bold text-[#424656] mt-1">
            Passed rejection engine
          </p>
        </div>
      </div>

      {/* ── Main Table ── */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {loading && runs.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-[#0061ff]" />
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="text-center py-24">
            <Search className="w-10 h-10 text-[#94a3b8] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#191c1e] mb-1">No runs found</h3>
            <p className="text-sm text-[#565e74] mb-6">Start your first run to see results here.</p>
            <Button onClick={() => router.push("/search")} className="gap-2 bg-[#0061ff] hover:bg-[#004bca] text-white">
              <Plus className="w-4 h-4" /> Create First Run
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2f4f6]">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Run</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Parameters</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Jobs</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#737687]">Companies</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#737687] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c2c6d9]/10">
                  {filteredRuns.map((run) => {
                    const id = run.id || run._id || ""
                    const sc = statusConfig[run.status] || statusConfig.active
                    const { date, time } = fmtDate(run.runStartedAt)
                    return (
                      <tr
                        key={id}
                        onClick={() => router.push(`/runs/${id}`)}
                        className="hover:bg-[#f2f4f6] transition-colors group cursor-pointer"
                      >
                        {/* Run Name */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#dbe1ff] flex items-center justify-center text-[#004bca]">
                              <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-[#191c1e] group-hover:text-[#004bca] transition-colors">{run.title}</div>
                              <div className="text-xs text-[#737687]">{run.source}</div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${sc.color} ${run.status === "active" ? "animate-pulse" : ""}`} />
                            <span className={`text-xs font-bold uppercase ${sc.textColor}`}>{sc.label}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-5">
                          <div className="font-mono text-sm text-[#424656]">{date}</div>
                          <div className="text-[10px] text-[#737687] font-medium">{time}</div>
                        </td>

                        {/* Parameters */}
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-1.5">
                            {run.runConfig.searchTitles.slice(0, 2).map((t) => (
                              <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eaddff] text-[#5a00c6]">{t}</span>
                            ))}
                            {run.runConfig.searchLocations.slice(0, 1).map((l) => (
                              <span key={l} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dae2fd] text-[#3f465c]">{l}</span>
                            ))}
                          </div>
                        </td>

                        {/* Jobs */}
                        <td className="px-6 py-5">
                          <div className="font-mono text-sm font-bold text-[#191c1e]">{run.stats.totalJobsScraped}</div>
                          <div className="text-[10px] font-bold text-emerald-600">{run.stats.acceptedJobs ?? 0} accepted</div>
                        </td>

                        {/* Companies */}
                        <td className="px-6 py-5">
                          <div className="font-mono text-sm font-bold text-[#191c1e]">{run.stats.uniqueCompanies ?? 0}</div>
                          <div className="text-[10px] font-bold text-emerald-600">{run.stats.acceptedCompanies ?? 0} accepted</div>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/runs/${id}`) }}
                            className="px-3 py-1.5 text-xs font-bold bg-[#e6e8ea] text-[#191c1e] rounded-lg hover:bg-[#004bca] hover:text-white transition-all"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-[#f2f4f6] flex items-center justify-between">
              <div className="text-xs text-[#424656] font-medium">
                Page <span className="font-mono">{page}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-[#e6e8ea] text-[#737687] disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#004bca] text-white">{page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
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
  )
}
