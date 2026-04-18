"use client"

import { ArrowLeft, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProspectAnalyticsPage() {
  const router = useRouter()

  return (
    <div className="p-8 flex-1 max-w-7xl w-full mx-auto space-y-8">
      <button
        onClick={() => router.push("/dashboards")}
        className="flex items-center gap-2 text-sm text-[#565e74] hover:text-[#191c1e] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboards
      </button>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="page-heading mb-0">Prospect Analytics</h2>
          <p className="page-subtitle">Prospect pipeline, conversion funnels, and engagement metrics.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e0e3e5] p-12 text-center">
        <Users className="w-10 h-10 text-[#94a3b8] mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-[#191c1e] mb-1">Prospect Analytics Dashboard</h3>
        <p className="text-sm text-[#565e74]">Charts and tables will be populated here.</p>
      </div>
    </div>
  )
}
