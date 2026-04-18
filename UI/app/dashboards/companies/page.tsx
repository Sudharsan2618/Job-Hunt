"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
  Users,
  Factory,
  BarChart3,
} from "lucide-react"
import { fetchCompaniesAnalytics, type CompaniesAnalytics } from "@/lib/api"

const CHART_COLORS = [
  "#0061ff", "#6b21dc", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"
]

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
  let angle = -90

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
        <circle cx={center} cy={center} r={innerRadius} fill="white" />
      </svg>

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

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="space-y-4">
      {data.map((d, i) => {
        const pct = (d.value / maxValue) * 100
        return (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#424656]">{d.label}</span>
              <span className="font-mono text-[#737687]">{d.value}</span>
            </div>
            <div className="w-full h-4 bg-[#f2f4f6] rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: d.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CompanyAnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<CompaniesAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await fetchCompaniesAnalytics()
      setData(d)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const s = data?.summary ?? { total: 0, accepted: 0, rejected: 0, acceptanceRate: 0, avgEmployees: 0 }

  // Prepare pie chart data
  const industryData: PieSlice[] = (data?.byIndustry ?? [])
    .slice(0, 8)
    .map((i, idx) => ({
      label: i.industry,
      value: i.count,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }))

  const sizeData: PieSlice[] = (data?.bySize ?? [])
    .slice(0, 8)
    .map((b, idx) => ({
      label: b.range,
      value: b.count,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }))

  const rejectionData: PieSlice[] = (data?.byRejectionReason ?? [])
    .slice(0, 8)
    .map((r, idx) => ({
      label: r.reason,
      value: r.count,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }))

  const industryTotal = industryData.reduce((sum, i) => sum + i.value, 0)
  const sizeTotal = sizeData.reduce((sum, s) => sum + s.value, 0)
  const rejectionTotal = rejectionData.reduce((sum, r) => sum + r.value, 0)

  // Eligibility bar chart data
  const eligibilityData = [
    { label: "Accepted", value: s.accepted, color: "#10b981" },
    { label: "Rejected", value: s.rejected, color: "#ef4444" },
  ]

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

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#eaddff] flex items-center justify-center text-[#6b21dc]">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="page-heading mb-0">Company Analytics</h2>
          <p className="page-subtitle">Enrichment results, rejection reasons, and industry distribution across all data.</p>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-[#6b21dc]" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="card-surface p-5">
              <p className="stat-label flex items-center gap-2"><Building2 className="w-3 h-3 text-[#6b21dc]" />Total</p>
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
              <p className="stat-label flex items-center gap-2"><TrendingUp className="w-3 h-3 text-[#004bca]" />Accept Rate</p>
              <p className="stat-value">{s.acceptanceRate}%</p>
              <div className="w-full h-1.5 bg-[#f2f4f6] rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.acceptanceRate}%` }} />
              </div>
            </div>
            <div className="card-surface p-5">
              <p className="stat-label flex items-center gap-2"><Users className="w-3 h-3 text-orange-500" />Avg Employees</p>
              <p className="stat-value">{s.avgEmployees.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Industry - Pie Chart */}
            <div className="card-surface p-6">
              <h3 className="font-semibold text-[#191c1e] mb-4 flex items-center gap-2">
                <Factory className="w-4 h-4 text-[#6b21dc]" /> By Industry
              </h3>
              <PieChart data={industryData} total={industryTotal} />
            </div>

            {/* By Employee Count - Pie Chart */}
            <div className="card-surface p-6">
              <h3 className="font-semibold text-[#191c1e] mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" /> By Employee Count
              </h3>
              <PieChart data={sizeData} total={sizeTotal} />
            </div>

            {/* Rejection Reasons - Pie Chart */}
            <div className="card-surface p-6">
              <h3 className="font-semibold text-[#191c1e] mb-4 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" /> Rejection Reasons
              </h3>
              <PieChart data={rejectionData} total={rejectionTotal} />
            </div>

            {/* Eligibility Breakdown - Bar Chart */}
            <div className="card-surface p-6">
              <h3 className="font-semibold text-[#191c1e] mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" /> Eligibility Breakdown
              </h3>
              {s.total > 0 ? (
                <BarChart data={eligibilityData} />
              ) : (
                <p className="text-sm text-[#94a3b8]">No data</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
