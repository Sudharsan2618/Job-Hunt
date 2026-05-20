"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  Layers,
  Calendar,
  Settings,
  Info,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchRun, type Run } from "@/lib/api"

interface RunDetailContentProps {
  runId: string
}

export function RunDetailContent({ runId }: RunDetailContentProps) {
  const router = useRouter()
  const [run, setRun] = useState<Run | null>(null)
  const [loading, setLoading] = useState(true)

  const loadRun = useCallback(async () => {
    try {
      const data = await fetchRun(runId)
      setRun(data)
    } catch (e) {
      console.error(e)
    }
  }, [runId])

  useEffect(() => {
    setLoading(true)
    loadRun().finally(() => setLoading(false))
  }, [loadRun])

  // Auto-refresh if run is active
  useEffect(() => {
    if (!run || run.status !== "active") return
    const id = setInterval(() => {
      loadRun()
    }, 6000)
    return () => clearInterval(id)
  }, [run, loadRun])

  if (loading && !run) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#004bca]" />
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

  const statusBadge = () => {
    if (isActive) return <Badge className="bg-emerald-100 text-emerald-700 border-0">Active</Badge>
    if (isCompleted) return <Badge className="bg-blue-100 text-blue-700 border-0">Completed</Badge>
    if (isCancelled) return <Badge className="bg-red-100 text-red-700 border-0">Cancelled</Badge>
    return <Badge variant="secondary">{run.status}</Badge>
  }

  const mode = run.source || "jobspy"
  const modeDisplay = mode === "mixed" ? "JobSpy + Naukri" : mode

  // Naukri URL construction helper
  let naukriUrls: string[] = []
  if (mode === "naukri" || mode === "mixed") {
    if (run.runConfig?.searchUrl) {
      naukriUrls = [run.runConfig.searchUrl]
    } else {
      const titles = run.runConfig?.searchTitles || []
      const locations = run.runConfig?.searchLocations || ["chennai"]
      for (const title of titles) {
        for (const loc of locations) {
          const t_slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/[\s-]+/g, "-")
            .replace(/^-+|-+$/g, "")
          const l_slug = loc
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/[\s-]+/g, "-")
            .replace(/^-+|-+$/g, "")
          
          const q_title = encodeURIComponent(title)
          const q_loc = encodeURIComponent(loc)
          if (l_slug) {
            naukriUrls.push(`https://www.naukri.com/${t_slug}-jobs-in-${l_slug}?k=${q_title}&l=${q_loc}`)
          } else {
            naukriUrls.push(`https://www.naukri.com/${t_slug}-jobs?k=${q_title}`)
          }
        }
      }
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push("/search-history")}
          className="flex items-center gap-2 text-sm text-[#565e74] hover:text-[#191c1e] mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Runs
        </button>

        {/* Header Block */}
        <div className="flex items-start justify-between border-b border-[#e0e3e5]/60 pb-6 mb-8 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold text-[#191c1e]">{run.title}</h1>
              {statusBadge()}
            </div>
            <p className="text-sm text-[#565e74]">
              Run ID: <span className="font-mono text-xs">{run.id || run._id}</span>
            </p>
          </div>
          
          <Button
            onClick={() => router.push(`/runs/${runId}/results`)}
            className="bg-[#004bca] hover:bg-[#003ea8] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <span>View Results</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Mode Card */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#565e74] uppercase tracking-wider">Scraper Mode</span>
                <Layers className="w-4.5 h-4.5 text-[#004bca]" />
              </div>
              <p className="text-2xl font-extrabold text-[#191c1e] capitalize">{modeDisplay}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs text-[#737687]">
                Using {mode === "mixed" ? "JobSpy + Naukri" : mode === "naukri" ? "Naukri Scraper" : "JobSpy Library"}
              </span>
            </div>
          </div>

          {/* Duration Card */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#565e74] uppercase tracking-wider">Timeline</span>
                <Calendar className="w-4.5 h-4.5 text-[#004bca]" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-[#565e74] font-medium">
                  Start: <span className="text-[#191c1e] font-mono">{run.runStartedAt ? new Date(run.runStartedAt).toLocaleTimeString() : "—"}</span>
                </p>
                {run.runEndedAt && (
                  <p className="text-[#565e74] font-medium">
                    End: <span className="text-[#191c1e] font-mono">{new Date(run.runEndedAt).toLocaleTimeString()}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs text-[#737687]">
                {run.createdAt ? new Date(run.createdAt).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>

          {/* Config Card */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#565e74] uppercase tracking-wider">Parameters</span>
                <Settings className="w-4.5 h-4.5 text-[#004bca]" />
              </div>
              <div className="text-xs text-[#424656] space-y-1">
                <div><span className="font-semibold text-[#191c1e]">Titles:</span> {run.runConfig?.searchTitles?.join(", ") || "—"}</div>
                <div><span className="font-semibold text-[#191c1e]">Locations:</span> {run.runConfig?.searchLocations?.join(", ") || "—"}</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs text-[#737687]">
                Limit: {run.runConfig?.resultsPerSearch ?? 0} jobs/search
              </span>
            </div>
          </div>

        </div>

        {/* Naukri URL Section */}
        {mode === "naukri" && naukriUrls.length > 0 && (
          <div className="bg-slate-50 border border-[#e0e3e5] rounded-2xl p-6 mb-8">
            <h3 className="text-xs font-bold text-[#565e74] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#004bca]" />
              Naukri Search URL
            </h3>
            <div className="space-y-2">
              {naukriUrls.map((url, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-[#e0e3e5]/70 rounded-xl px-4 py-2.5 text-xs">
                  <span className="font-mono text-[#424656] truncate max-w-[85%]">{url}</span>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#004bca] hover:text-[#003ea8] flex items-center gap-0.5 ml-2 font-semibold">
                    Open <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Details */}
        <div className="bg-white border border-[#e0e3e5] rounded-2xl p-8 shadow-sm">
          <h2 className="text-base font-bold text-[#191c1e] mb-6 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-[#004bca]" />
            Execution Stats & Metadata
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-[#737687] uppercase tracking-wider mb-1">Scraped</p>
              <p className="text-2xl font-extrabold text-[#191c1e]">{stats.totalJobsScraped.toLocaleString()}</p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Accepted</p>
              <p className="text-2xl font-extrabold text-emerald-800">{stats.acceptedJobs ?? 0}</p>
            </div>

            <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1">Rejected</p>
              <p className="text-2xl font-extrabold text-red-800">{stats.rejectedJobs ?? 0}</p>
            </div>

            <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1">Inserted</p>
              <p className="text-2xl font-extrabold text-sky-800">{stats.inserted ?? 0}</p>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-center col-span-2 md:col-span-1">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Duplicates</p>
              <p className="text-2xl font-extrabold text-amber-800">{stats.duplicates ?? 0}</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
