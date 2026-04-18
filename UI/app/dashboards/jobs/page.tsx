"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
  BarChart3,
  MapPin,
  Search,
} from "lucide-react"
import { fetchJobsAnalytics, type JobsAnalytics } from "@/lib/api"

type Range = 7 | 30 | 90 | 0
const ranges: { value: Range; label: string }[] = [
  { value: 7, label: "7 Days" },
  { value: 30, label: "30 Days" },
  { value: 90, label: "90 Days" },
  { value: 0, label: "All Time" },
]

const CHART_COLORS = [
  "#0061ff", "#6b21dc", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"
]

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="w-full h-2 bg-[#f2f4f6] rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

interface PieSlice {
  label: string
  value: number
  color: string
}

function PieChart({ data, total }: { data: PieSlice[]; total: number }) {
  if (data.length === 0) {
    return <p className="text-sm text-[#94a3b8]">No data</p>
  }

  const radius = 70
  const innerRadius = 40
  const center = 80
  let angle = -90 // Start at top

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
        {data.map((slice, i) => {
          const angleSize = total > 0 ? (slice.value / total) * 360 : 0
          const x1 = center + radius * Math.cos((angle * Math.PI) / 180)
          const y1 = center + radius * Math.sin((angle * Math.PI) / 180)
          const x2 = center + radius * Math.cos(((angle + angleSize) * Math.PI) / 180)
          const y2 = center + radius * Math.sin(((angle + angleSize) * Math.PI) / 180)
          const largeArc = angleSize > 180 ? 1 : 0

          const path = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            "Z"
          ].join(" ")

          const result = <path key={i} d={path} fill={slice.color} />
          angle += angleSize
          return result
        })}
        {/* Inner circle for donut effect */}
        <circle cx={center} cy={center} r={innerRadius} fill="white" />
      </svg>

      {/* Legend */}
      <div className="mt-4 space-y-1 w-full">
        {data.map((slice, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 truncate">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: slice.color }} />
              <span className="text-[#424656] truncate">{slice.label}</span>
            </span>
            <span className="font-mono text-[#737687]">{slice.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function JobsAnalyticsPage() {
  const router = useRouter()
  const [days, setDays] = useState<Range>(7)
  const [data, setData] = useState<JobsAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await fetchJobsAnalytics(days)
      setData(d)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [days])

  useEffect(() => { load() }, [load])

  const s = data?.summary ?? { total: 0, accepted: 0, rejected: 0, acceptanceRate: 0 }

  // Prepare pie chart data
  const keywordData: PieSlice[] = (data?.byKeyword ?? [])
    .slice(0, 8)
    .map((k, i) => ({
      label: k.keyword || "Unknown",
      value: k.count,
      color: CHART_COLORS[i % CHART_COLORS.length]
    }))

  const locationData: PieSlice[] = (data?.byLocation ?? [])
    .slice(0, 8)
    .map((l, i) => ({
      label: l.location || "Unknown",
      value: l.count,
      color: CHART_COLORS[i % CHART_COLORS.length]
    }))

  const rejectionData: PieSlice[] = (data?.byRejectionReason ?? [])
    .slice(0, 8)
    .map((r, i) => ({
      label: r.reason,
      value: r.count,
      color: CHART_COLORS[i % CHART_COLORS.length]
    }))

  const keywordTotal = keywordData.reduce((sum, k) => sum + k.value, 0)
  const locationTotal = locationData.reduce((sum, l) => sum + l.value, 0)
  const rejectionTotal = rejectionData.reduce((sum, r) => sum + r.value, 0)

  return (
    <div className="p-8 flex-1 max-w-7xl w-full mx-auto space-y-8">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboards")}
        className="flex items-center gap-2 text-sm text-[#565e74] hover:text-[#191c1e] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboards
      </button>

      {/* Header + range picker */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#dbe1ff] flex items-center justify-center text-[#004bca]">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="page-heading mb-0">Jobs Analytics</h2>
            <p className="page-subtitle">Scraped jobs breakdown, acceptance rates, and board performance.</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-[#f2f4f6] p-1 rounded-xl">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                days === r.value ? "bg-white shadow-sm text-[#004bca]" : "text-[#424656] hover:bg-[#e6e8ea]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-[#0061ff]" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card-surface p-5">
              <p className="stat-label flex items-center gap-2"><Briefcase className="w-3 h-3 text-[#004bca]" />Total Jobs</p>
              <p className="stat-value">{s.total.toLocaleString()}</p>
            </div>
            <div className="card-surface p-5">
              <p className="stat-label flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500" />Accepted</p>
              <p className="stat-value text-emerald-600">{s.accepted.toLocaleString()}</p>
            </div>
            <div className="card-surface p-5">
              <p className="stat-label flex items-center gap-2"><XCircle className="w-3 h-3 text-red-500" />Rejected</p>
              <p className="stat-value text-red-500">{s.rejected.toLocaleString()}</p>
            </div>
            <div className="card-surface p-5">
              <p className="stat-label flex items-center gap-2"><TrendingUp className="w-3 h-3 text-[#004bca]" />Acceptance Rate</p>
              <p className="stat-value">{s.acceptanceRate}%</p>
              <div className="w-full h-1.5 bg-[#f2f4f6] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.acceptanceRate}%` }} />
              </div>
            </div>
          </div>

          {/* Daily trend */}
          {data?.dailyTrend && data.dailyTrend.length > 0 && (
            <div className="card-surface p-6">
              <h3 className="font-semibold text-[#191c1e] mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#004bca]" /> Daily Trend
              </h3>
              <div className="flex items-end gap-1 h-32">
                {data.dailyTrend.map((d) => {
                  const maxVal = Math.max(...data.dailyTrend.map((t) => t.total), 1)
                  const h = Math.max(4, (d.total / maxVal) * 100)
                  const acceptedH = d.total > 0 ? (d.accepted / d.total) * h : 0
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full flex flex-col justify-end" style={{ height: "100%" }}>
                        <div className="w-full rounded-t bg-red-300" style={{ height: `${h - acceptedH}%`, minHeight: d.rejected > 0 ? 2 : 0 }} />
                        <div className="w-full rounded-t bg-emerald-400" style={{ height: `${acceptedH}%`, minHeight: d.accepted > 0 ? 2 : 0 }} />
                      </div>
                      <span className="text-[9px] text-[#94a3b8] rotate-[-45deg] origin-top-left whitespace-nowrap mt-1">
                        {d.date.slice(5)}
                      </span>
                      <div className="absolute -top-8 bg-[#191c1e] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                        {d.date}: {d.total} total, {d.accepted} accepted
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-[#565e74]">
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-emerald-400" /> Accepted</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-300" /> Rejected</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Board - keep as bars */}
            <div className="card-surface p-6">
              <h3 className="font-semibold text-[#191c1e] mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#6b21dc]" /> By Job Board
              </h3>
              <div className="space-y-3">
                {(data?.byBoard ?? []).map((b) => (
                  <div key={b.board}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-[#191c1e] capitalize">{b.board}</span>
                      <span className="font-mono text-[#565e74]">{b.count}</span>
                    </div>
                    <Bar value={b.count} max={s.total} color="bg-[#0061ff]" />
                  </div>
                ))}
                {(data?.byBoard ?? []).length === 0 && <p className="text-sm text-[#94a3b8]">No data</p>}
              </div>
            </div>

            {/* By Search Keyword - Pie Chart */}
            <div className="card-surface p-6">
              <h3 className="font-semibold text-[#191c1e] mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#004bca]" /> By Search Keyword
              </h3>
              <PieChart data={keywordData} total={keywordTotal} />
            </div>

            {/* By Location - Pie Chart */}
            <div className="card-surface p-6">
              <h3 className="font-semibold text-[#191c1e] mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" /> By Location
              </h3>
              <PieChart data={locationData} total={locationTotal} />
            </div>

            {/* Top Rejection Reasons - Pie Chart */}
            <div className="card-surface p-6">
              <h3 className="font-semibold text-[#191c1e] mb-4 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" /> Top Rejection Reasons
              </h3>
              <PieChart data={rejectionData} total={rejectionTotal} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
