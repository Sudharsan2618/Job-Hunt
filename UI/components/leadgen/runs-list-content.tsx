"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Briefcase,
  Building2,
  MapPin,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchRuns, type Run } from "@/lib/api"

export function RunsListContent() {
  const router = useRouter()
  const [runs, setRuns] = useState<Run[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
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

  // Auto-refresh every 8s for active runs
  useEffect(() => {
    const hasActive = runs.some((r) => r.status === "active")
    if (!hasActive) return
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [runs, load])

  const statusBadge = (status: Run["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </Badge>
        )
      case "completed":
        return (
          <Badge className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
            <CheckCircle className="w-3 h-3" />
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="gap-1.5 bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
            <XCircle className="w-3 h-3" />
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="gap-1.5">
            <Clock className="w-3 h-3" />
            {status}
          </Badge>
        )
    }
  }

  const fmtDate = (d: string | null) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#191c1e]">Runs</h1>
            <p className="text-sm text-[#565e74] mt-1">
              All scraping runs and their progress
            </p>
          </div>
          <Button
            onClick={() => router.push("/search")}
            className="gap-2 bg-[#0061ff] hover:bg-[#004bca] text-white"
          >
            <Plus className="w-4 h-4" />
            New Run
          </Button>
        </div>

        {/* List */}
        {loading && runs.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-[#0061ff]" />
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl border border-[#e0e3e5]">
            <Search className="w-10 h-10 text-[#94a3b8] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#191c1e] mb-1">No runs yet</h2>
            <p className="text-sm text-[#565e74] mb-6">
              Start your first run by clicking the button above.
            </p>
            <Button
              onClick={() => router.push("/search")}
              className="gap-2 bg-[#0061ff] hover:bg-[#004bca] text-white"
            >
              <Plus className="w-4 h-4" />
              Create First Run
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => {
              const id = run.id || run._id || ""
              const stats = run.stats
              return (
                <button
                  key={id}
                  onClick={() => router.push(`/runs/${id}`)}
                  className="w-full text-left bg-white rounded-xl border border-[#e0e3e5] p-5 hover:border-[#0061ff]/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-[#191c1e] truncate group-hover:text-[#0061ff] transition-colors">
                          {run.title}
                        </h3>
                        {statusBadge(run.status)}
                      </div>

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#565e74]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {fmtDate(run.runStartedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {run.runConfig.searchTitles.slice(0, 2).join(", ")}
                          {run.runConfig.searchTitles.length > 2 && ` +${run.runConfig.searchTitles.length - 2}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {run.runConfig.searchLocations.join(", ")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {run.runConfig.siteName.join(", ")}
                        </span>
                      </div>
                    </div>

                    {/* Right — stats */}
                    <div className="flex items-center gap-6 ml-6 shrink-0">
                      <div className="text-center">
                        <p className="text-lg font-bold text-[#191c1e]">
                          {stats.totalJobsScraped}
                        </p>
                        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider">
                          Jobs
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600">
                          {stats.acceptedCompanies ?? 0}
                        </p>
                        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider">
                          Accepted
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-500">
                          {stats.rejectedCompanies ?? 0}
                        </p>
                        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider">
                          Rejected
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#94a3b8] group-hover:text-[#0061ff] transition-colors" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {(runs.length > 0 || page > 1) && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-[#565e74]">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
