"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Briefcase,
  Building2,
  Users,
  ArrowRight,
  BarChart3,
  Loader2,
} from "lucide-react"
import { fetchJobsAnalytics, fetchCompaniesAnalytics } from "@/lib/api"

interface DashboardCard {
  id: string
  title: string
  description: string
  icon: typeof Briefcase
  iconBg: string
  iconColor: string
  href: string
  stats: { label: string; value: string }[]
}

export function DashboardsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<DashboardCard[]>([])

  useEffect(() => {
    async function load() {
      const base: DashboardCard[] = [
        {
          id: "jobs", title: "Jobs Analytics",
          description: "Scraped jobs breakdown, acceptance rates, title analysis, and board-level performance.",
          icon: Briefcase, iconBg: "bg-[#dbe1ff]", iconColor: "text-[#004bca]", href: "/dashboards/jobs",
          stats: [{ label: "Total Jobs", value: "—" }, { label: "Acceptance Rate", value: "—" }],
        },
        {
          id: "companies", title: "Company Analytics",
          description: "Company enrichment results, rejection reasons, industry distribution, and staff-count trends.",
          icon: Building2, iconBg: "bg-[#eaddff]", iconColor: "text-[#6b21dc]", href: "/dashboards/companies",
          stats: [{ label: "Total Companies", value: "—" }, { label: "Accept Rate", value: "—" }],
        },
        {
          id: "prospects", title: "Prospect Analytics",
          description: "Prospect pipeline, conversion funnels, outreach performance, and engagement metrics.",
          icon: Users, iconBg: "bg-orange-100", iconColor: "text-orange-600", href: "/dashboards/prospects",
          stats: [{ label: "Total Prospects", value: "—" }, { label: "Conversion Rate", value: "—" }],
        },
      ]

      try {
        const [jobsData, companiesData] = await Promise.all([
          fetchJobsAnalytics(0).catch(() => null),
          fetchCompaniesAnalytics().catch(() => null),
        ])

        if (jobsData) {
          base[0].stats = [
            { label: "Total Jobs", value: jobsData.summary.total.toLocaleString() },
            { label: "Acceptance Rate", value: `${jobsData.summary.acceptanceRate}%` },
          ]
        }
        if (companiesData) {
          base[1].stats = [
            { label: "Total Companies", value: companiesData.summary.total.toLocaleString() },
            { label: "Accept Rate", value: `${companiesData.summary.acceptanceRate}%` },
          ]
        }
      } catch { /* keep defaults */ }

      setCards(base)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="p-8 flex-1 max-w-7xl w-full mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="page-heading">Dashboards</h2>
        <p className="page-subtitle">Analytics and insights across your lead generation pipeline.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-[#0061ff]" />
        </div>
      ) : (
        <>
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((d) => {
              const Icon = d.icon
              return (
                <button
                  key={d.id}
                  onClick={() => router.push(d.href)}
                  className="text-left bg-white rounded-2xl border border-[#e0e3e5] p-6 hover:border-[#0061ff]/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${d.iconBg} flex items-center justify-center ${d.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#94a3b8] group-hover:text-[#0061ff] transition-colors" />
                  </div>

                  <h3 className="text-lg font-bold text-[#191c1e] mb-1 group-hover:text-[#004bca] transition-colors">
                    {d.title}
                  </h3>
                  <p className="text-sm text-[#565e74] mb-5 leading-relaxed">{d.description}</p>

                  <div className="flex items-center gap-4 pt-4 border-t border-[#e0e3e5]">
                    {d.stats.map((s) => (
                      <div key={s.label}>
                        <p className="text-xs text-[#737687] uppercase tracking-wider font-medium">{s.label}</p>
                        <p className="text-lg font-bold text-[#191c1e]">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Placeholder info */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-8 text-center">
            <BarChart3 className="w-10 h-10 text-[#94a3b8] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#191c1e] mb-1">More dashboards coming soon</h3>
            <p className="text-sm text-[#565e74]">
              We&apos;re building deeper analytics on outreach cadences, CRM sync health, and AI agent performance.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
