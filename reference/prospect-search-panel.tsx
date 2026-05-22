"use client"

import { useState } from "react"
import {
  X,
  Search,
  Building2,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  Zap,
  Target,
  Users2,
  AlertCircle,
  ArrowRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  searchProspects,
  type ProspectSearchStrategy,
  type ProspectSearchResponse,
  type ProspectSearchCompanyResult,
} from "@/lib/api"

interface CompanyInfo {
  companyId: string
  companyName: string
  jobTitle: string
  jobId: string
}

interface ProspectSearchPanelProps {
  isOpen: boolean
  onClose: () => void
  runId: string
  companies: CompanyInfo[]
  onSearchComplete?: () => void
}

const STRATEGY_OPTIONS: {
  value: ProspectSearchStrategy
  label: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
}[] = [
  {
    value: "full",
    label: "Full Search",
    description: "Title-based search first. If no results, falls back to management-level search.",
    icon: <Zap className="w-4 h-4" />,
    color: "text-violet-600",
    bgColor: "bg-violet-50 border-violet-200",
  },
  {
    value: "title",
    label: "Title Based Search",
    description: "Search prospects by job title / persona match only. No fallback.",
    icon: <Target className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  {
    value: "management",
    label: "Management Level Search",
    description: "Search by seniority level with pre/post filtering for buyer relevance.",
    icon: <Users2 className="w-4 h-4" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
  },
]

export function ProspectSearchPanel({
  isOpen,
  onClose,
  runId,
  companies,
  onSearchComplete,
}: ProspectSearchPanelProps) {
  const [strategy, setStrategy] = useState<ProspectSearchStrategy>("full")
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<ProspectSearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedStrategy = STRATEGY_OPTIONS.find((s) => s.value === strategy)!

  const handleRunSearch = async () => {
    if (companies.length === 0) return

    setIsSearching(true)
    setError(null)
    setResult(null)

    try {
      const companyIds = companies.map((c) => c.companyId).filter(Boolean)
      if (companyIds.length === 0) {
        setError("No valid company IDs found for the selected jobs")
        return
      }
      const response = await searchProspects(runId, companyIds, strategy)
      setResult(response)
      if (onSearchComplete) onSearchComplete()
    } catch (err: any) {
      setError(err.message || "Prospect search failed")
    } finally {
      setIsSearching(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    setError(null)
    setDropdownOpen(false)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Slide Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[520px] max-w-[90vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-[#e0e3e5] px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
              <Search className="w-5 h-5 text-[#004bca]" />
            </div>
            <div>
              <h2 className="font-bold text-[#191c1e] text-lg">Prospect Search</h2>
              <p className="text-xs text-[#737687]">Find prospects for selected companies</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[#f2f4f6] text-[#565e74] hover:text-[#191c1e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Selected Companies */}
          <div className="px-6 pt-5 pb-4">
            <h3 className="text-[10px] font-bold text-[#737687] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              Selected Companies ({companies.length})
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {companies.map((company, idx) => (
                <div
                  key={`${company.companyId}-${idx}`}
                  className="flex items-center gap-3 px-3 py-2.5 bg-[#f7f9fb] rounded-lg border border-[#e0e3e5]/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#e0e3e5] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-[#424656]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#191c1e] truncate">{company.companyName}</p>
                    <p className="text-[10px] text-[#737687] truncate">{company.jobTitle}</p>
                  </div>
                  {/* Result indicator */}
                  {result && (() => {
                    const companyResult = result.results.find(
                      (r) => r.companyId === company.companyId
                    )
                    if (!companyResult) return null
                    if (companyResult.skipped) {
                      return (
                        <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[9px] shrink-0">
                          Skipped
                        </Badge>
                      )
                    }
                    return (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px] shrink-0">
                        {companyResult.accepted} found
                      </Badge>
                    )
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#e0e3e5]/50 mx-6" />

          {/* Strategy Selector */}
          <div className="px-6 pt-5 pb-4">
            <h3 className="text-[10px] font-bold text-[#737687] uppercase tracking-widest mb-3">
              Search Strategy
            </h3>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={isSearching}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                  dropdownOpen ? "border-[#004bca] shadow-md" : "border-[#e0e3e5] hover:border-[#c2c6d9]"
                } ${isSearching ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedStrategy.bgColor}`}>
                  <span className={selectedStrategy.color}>{selectedStrategy.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#191c1e]">{selectedStrategy.label}</p>
                  <p className="text-[10px] text-[#737687] mt-0.5 line-clamp-1">
                    {selectedStrategy.description}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#737687] transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e0e3e5] rounded-xl shadow-xl z-10 overflow-hidden">
                  {STRATEGY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (strategy !== opt.value) {
                          setStrategy(opt.value)
                          setResult(null)
                          setError(null)
                        }
                        setDropdownOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#f7f9fb] transition-colors border-b border-[#e0e3e5]/30 last:border-b-0 ${
                        strategy === opt.value ? "bg-[#f0f4ff]" : ""
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${opt.bgColor}`}>
                        <span className={opt.color}>{opt.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#191c1e]">{opt.label}</p>
                          {strategy === opt.value && (
                            <CheckCircle className="w-3.5 h-3.5 text-[#004bca]" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#737687] mt-0.5">{opt.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">Search Failed</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="px-6 pb-4">
              <div className="border-t border-[#e0e3e5]/50 pt-5 mb-4" />
              <h3 className="text-[10px] font-bold text-[#737687] uppercase tracking-widest mb-3">
                Search Results
              </h3>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{result.totalAccepted}</p>
                  <p className="text-[10px] font-medium text-emerald-600 uppercase">Accepted</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{result.totalRejected}</p>
                  <p className="text-[10px] font-medium text-red-500 uppercase">Rejected</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{result.companiesProcessed}</p>
                  <p className="text-[10px] font-medium text-blue-600 uppercase">Processed</p>
                </div>
              </div>

              {/* Per-Company Results */}
              <div className="space-y-2">
                {result.results.map((r: ProspectSearchCompanyResult, idx: number) => (
                  <div
                    key={`${r.companyId}-${idx}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                      r.skipped
                        ? "bg-amber-50/50 border-amber-200/60"
                        : r.accepted > 0
                        ? "bg-emerald-50/50 border-emerald-200/60"
                        : "bg-slate-50 border-slate-200/60"
                    }`}
                  >
                    {r.skipped ? (
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : r.accepted > 0 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#191c1e] truncate">{r.companyName}</p>
                      <p className="text-[10px] text-[#737687] truncate">
                        {r.skipped
                          ? r.skipReason || "Skipped"
                          : `${r.accepted} accepted · ${r.rejected} rejected · ${r.strategy || "N/A"} path`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-[#737687] mt-4 italic text-center">{result.message}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-[#e0e3e5] px-6 py-4 shrink-0 bg-white">
          {result ? (
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-[#004bca] text-white text-sm font-bold hover:bg-[#003ba0] transition-colors flex items-center justify-center gap-2"
            >
              Done
            </button>
          ) : (
            <button
              onClick={handleRunSearch}
              disabled={isSearching || companies.length === 0}
              className="w-full py-3 rounded-xl bg-[#004bca] text-white text-sm font-bold hover:bg-[#003ba0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching Prospects...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Prospects for {companies.length} Compan{companies.length === 1 ? "y" : "ies"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
