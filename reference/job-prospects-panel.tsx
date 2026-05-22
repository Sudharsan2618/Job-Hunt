"use client"

import { useState, useEffect, useMemo } from "react"
import {
  X,
  Linkedin,
  MapPin,
  Mail,
  Phone,
  Copy,
  CheckCheck,
  Users,
  Loader2,
  Briefcase,
  ExternalLink,
  Shield,
  Filter,
  MoreVertical,
  RefreshCw,
  Send,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { fetchJobProspects, fetchOutreachStatus, type JobProspect, enrichProspects, fetchEnrichmentCredits, type EnrichmentCreditStatus } from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface JobProspectsPanelProps {
  isOpen: boolean
  onClose: () => void
  jobId: string | null
  jobTitle: string
  companyName: string
  runId: string
  onProspectsSelected?: (jobId: string, prospectIds: string[], prospectsData: any[]) => void
  onEnrichmentComplete?: () => void
}

export function JobProspectsPanel({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  runId,
  onProspectsSelected,
  onEnrichmentComplete,
}: JobProspectsPanelProps) {
  const [prospects, setProspects] = useState<JobProspect[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [emailTemplate, setEmailTemplate] = useState<any>(null)
  const [creditStatus, setCreditStatus] = useState<EnrichmentCreditStatus | null>(null)
  const [creditLoading, setCreditLoading] = useState(false)
  
  const [activeTab, setActiveTab] = useState<"All" | "Accepted" | "Rejected">("All")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined" && jobId) {
      const saved = localStorage.getItem(`hr-run-selected-prospects-${runId}-${jobId}`)
      if (saved) {
        try {
          return new Set(JSON.parse(saved))
        } catch {
          return new Set()
        }
      }
    }
    return new Set()
  })
  const [activeProspectId, setActiveProspectId] = useState<string | null>(null)

  // Outreach status map: prospectId -> outreach record
  const [outreachMap, setOutreachMap] = useState<Record<string, {
    status: string
    errorDetail?: string
    updatedAt: string
    sentAt?: string
  }>>({})

  // Function to refresh outreach status
  const refreshOutreachStatus = async () => {
    if (!runId) return
    
    try {
      setRefreshing(true)
      const outreachData = await fetchOutreachStatus(runId)
      
      // Build lookup map: prospectId -> outreach record
      const map: typeof outreachMap = {}
      for (const rec of (outreachData as any).records || []) {
        map[rec.prospectId] = {
          status: rec.status,
          errorDetail: rec.errorDetail,
          updatedAt: rec.updatedAt,
          sentAt: rec.sentAt,
        }
      }
      setOutreachMap(map)
    } catch (e) {
      console.error("Failed to refresh outreach status:", e)
    } finally {
      setRefreshing(false)
    }
  }

  // Fetch enrichment credit status
  const loadCredits = async () => {
    if (!runId) return
    setCreditLoading(true)
    try {
      const data = await fetchEnrichmentCredits(runId)
      setCreditStatus(data)
    } catch (e) {
      console.error("Failed to load enrichment credits:", e)
    } finally {
      setCreditLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !jobId) return
    
    // Sync selectedIds from localStorage when panel opens or jobId changes
    const saved = localStorage.getItem(`hr-run-selected-prospects-${runId}-${jobId}`)
    if (saved) {
      try {
        setSelectedIds(new Set(JSON.parse(saved)))
      } catch {
        setSelectedIds(new Set())
      }
    } else {
      setSelectedIds(new Set())
    }

    setLoading(true)
    Promise.all([
      fetchJobProspects(jobId),
      fetchOutreachStatus(runId).catch(() => ({ records: [] })),
      fetchEnrichmentCredits(runId).catch(() => null),
    ])
      .then(([prospectData, outreachData, creditsData]) => {
        setProspects(prospectData.prospects)
        setEmailTemplate(prospectData.emailTemplate)
        if (prospectData.prospects.length > 0) {
          setActiveProspectId(prospectData.prospects[0]._id)
        }
        // Build lookup map: prospectId -> outreach record
        const map: typeof outreachMap = {}
        for (const rec of (outreachData as any).records || []) {
          map[rec.prospectId] = {
            status: rec.status,
            errorDetail: rec.errorDetail,
            updatedAt: rec.updatedAt,
            sentAt: rec.sentAt,
          }
        }
        setOutreachMap(map)
        if (creditsData) setCreditStatus(creditsData)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [isOpen, jobId, runId])

  // Polling effect for outreach status updates
  useEffect(() => {
    if (!isOpen || !jobId) return

    // Poll every 4 seconds while panel is open
    const interval = setInterval(() => {
      refreshOutreachStatus()
    }, 4000)

    return () => clearInterval(interval)
  }, [isOpen, jobId, runId])

  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      if (activeTab === "All") return true
      if (activeTab === "Accepted") return p.isAccepted
      if (activeTab === "Rejected") return !p.isAccepted
      return true
    })
  }, [prospects, activeTab])

  // When tab changes, reset active prospect if it doesn't belong to the new tab
  useEffect(() => {
    if (activeProspectId) {
      const stillVisible = filteredProspects.find(p => p._id === activeProspectId)
      if (!stillVisible && filteredProspects.length > 0) {
        setActiveProspectId(filteredProspects[0]._id)
      }
    }
  }, [filteredProspects, activeProspectId])

  const activeProspect = useMemo(() => prospects.find(p => p._id === activeProspectId), [prospects, activeProspectId])

  const handleSelectAll = (checked: boolean) => {
    const next = checked ? new Set(filteredProspects.map(p => p._id)) : new Set()
    setSelectedIds(next)
    
    // Save to localStorage
    if (jobId && runId) {
      localStorage.setItem(`hr-run-selected-prospects-${runId}-${jobId}`, JSON.stringify([...next]))
    }
    
    // Notify parent component
    if (onProspectsSelected && jobId) {
      onProspectsSelected(jobId, [...next], prospects)
    }
  }

  const handleSelectProspect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
    
    // Save to localStorage
    if (jobId && runId) {
      localStorage.setItem(`hr-run-selected-prospects-${runId}-${jobId}`, JSON.stringify([...next]))
    }
    
    // Notify parent component
    if (onProspectsSelected && jobId) {
      onProspectsSelected(jobId, [...next], prospects)
    }
  }

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }
  
  // ── Credit guardrail — blocks enrichment before API call ─────────
  const [enrichBlockedMsg, setEnrichBlockedMsg] = useState<string | null>(null)

  const getNextRefreshTime = (): string => {
    if (creditStatus?.periodEnd) {
      const end = new Date(creditStatus.periodEnd)
      const now = new Date()
      const diffMs = end.getTime() - now.getTime()
      if (diffMs <= 0) return "momentarily (refresh in progress)"
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `in ${hours}h ${mins}m (midnight UTC)`
    }
    return "at midnight UTC"
  }

  /**
   * Pre-flight check before any enrichment. Returns true if allowed.
   * Sets enrichBlockedMsg with a user-friendly reason if blocked.
   */
  const canEnrich = (prospectCount: number): boolean => {
    setEnrichBlockedMsg(null)

    if (!creditStatus) return true // no credit data yet — let backend decide

    // Check 1: Daily credits exhausted
    if (creditStatus.creditsRemaining <= 0) {
      setEnrichBlockedMsg(
        `Daily enrichment limit reached (${creditStatus.dailyLimit}/${creditStatus.dailyLimit} used). ` +
        `Credits will refresh ${getNextRefreshTime()}.`
      )
      return false
    }

    // Check 2: Per-job limit
    if (jobId) {
      const jobUsed = creditStatus.jobCredits?.[jobId] || 0
      const jobRemaining = creditStatus.perJobLimit - jobUsed

      if (jobRemaining <= 0) {
        setEnrichBlockedMsg(
          `This job has reached the per-job enrichment limit of ${creditStatus.perJobLimit}. ` +
          `You can still enrich prospects from other jobs.`
        )
        return false
      }

      // Check 3: Trying to enrich MORE prospects than remaining job credits
      if (prospectCount > jobRemaining) {
        setEnrichBlockedMsg(
          `You selected ${prospectCount} prospect(s) but only ${jobRemaining} enrichment credit(s) remain for this job ` +
          `(limit: ${creditStatus.perJobLimit} per job). Please select at most ${jobRemaining} prospect(s).`
        )
        return false
      }
    }

    // Check 4: Trying to enrich more than daily remaining
    if (prospectCount > creditStatus.creditsRemaining) {
      setEnrichBlockedMsg(
        `You selected ${prospectCount} prospect(s) but only ${creditStatus.creditsRemaining} daily credit(s) remain. ` +
        `Please reduce your selection or wait for credits to refresh ${getNextRefreshTime()}.`
      )
      return false
    }

    return true
  }

  const handleEnrich = async (ids: string[]) => {
    if (ids.length === 0) return

    // Frontend guardrail — block before API call
    if (!canEnrich(ids.length)) return

    setEnriching(true)
    setEnrichBlockedMsg(null)
    try {
      const result = await enrichProspects(ids, runId, jobId || undefined)
      // Re-fetch prospects + credits after enrichment
      if (jobId) {
        const data = await fetchJobProspects(jobId)
        setProspects(data.prospects)
      }
      // Refresh credit status after enrichment
      await loadCredits()

      // Notify parent to refresh its global credit status
      if (onEnrichmentComplete) {
        onEnrichmentComplete()
      }
      
      // Show credit limit message if applicable
      if (result.skippedNoCredit && result.skippedNoCredit > 0) {
        setEnrichBlockedMsg(
          `${result.skippedNoCredit} prospect(s) were skipped by the server due to credit limits. ${result.message}`
        )
      }
    } catch (e) {
      console.error("Enrichment failed:", e)
    } finally {
      setEnriching(false)
    }
  }

  const getSeniorityColor = (seniority: string) => {
    const colors: Record<string, string> = {
      c_suite: "bg-violet-100 text-violet-700 border-violet-200",
      vp: "bg-blue-100 text-blue-700 border-blue-200",
      director: "bg-emerald-100 text-emerald-700 border-emerald-200",
      head: "bg-amber-100 text-amber-700 border-amber-200",
      manager: "bg-slate-100 text-slate-600 border-slate-200",
    }
    return colors[seniority?.toLowerCase()] || "bg-slate-100 text-slate-600 border-slate-200"
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[95vw] max-w-5xl bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header - Simple Title */}
        <div className="flex items-center justify-between border-b border-[#e0e3e5] px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dbe1ff] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#004bca]" />
            </div>
            <div>
              <h2 className="font-bold text-[#191c1e] text-lg">
                Prospects
              </h2>
              <p className="text-xs text-[#737687]">Found for this job posting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#f2f4f6] text-[#565e74] hover:text-[#191c1e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Job context */}
        <div className="bg-[#f7f9fb] px-6 py-3 border-b flex items-center justify-between shrink-0">
          <div className="flex items-start gap-3">
            <Briefcase className="w-4 h-4 text-[#004bca] mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#191c1e] truncate">{jobTitle}</p>
              <p className="text-xs text-[#737687]">{companyName}</p>
            </div>
          </div>

          {/* Credit Status Meter */}
          {creditStatus && (
            <div className="flex items-center gap-4 shrink-0">
              {/* Per-Job Credit */}
              {jobId && (() => {
                const jobUsed = creditStatus.jobCredits?.[jobId] || 0
                const jobLimit = creditStatus.perJobLimit
                const jobPct = Math.round((jobUsed / jobLimit) * 100)
                const isJobFull = jobUsed >= jobLimit
                return (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#e0e3e5] shadow-sm">
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-[#737687] uppercase tracking-wider">This Job</p>
                      <p className={`text-xs font-black ${isJobFull ? 'text-red-600' : 'text-[#191c1e]'}`}>
                        {jobUsed}/{jobLimit}
                      </p>
                    </div>
                    <div className="w-10 h-10 relative">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#e5e7eb" strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={isJobFull ? '#ef4444' : jobPct > 66 ? '#f59e0b' : '#22c55e'}
                          strokeWidth="3"
                          strokeDasharray={`${jobPct}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                )
              })()}

              {/* Daily Credit */}
              {(() => {
                const used = creditStatus.creditsUsed
                const limit = creditStatus.dailyLimit
                const remaining = creditStatus.creditsRemaining
                const pct = Math.round((used / limit) * 100)
                const isDailyFull = remaining <= 0
                return (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#e0e3e5] shadow-sm">
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-[#737687] uppercase tracking-wider">Daily</p>
                      <p className={`text-xs font-black ${isDailyFull ? 'text-red-600' : 'text-[#191c1e]'}`}>
                        {used}/{limit}
                      </p>
                    </div>
                    <div className="w-10 h-10 relative">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#e5e7eb" strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={isDailyFull ? '#ef4444' : pct > 66 ? '#f59e0b' : '#22c55e'}
                          strokeWidth="3"
                          strokeDasharray={`${pct}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* Content Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: List */}
          <div className="w-2/5 flex flex-col border-r border-[#e0e3e5] bg-white">
            {/* Nav Tabs */}
            <div className="flex items-center justify-between px-4 pt-3 border-b shrink-0">
              <div className="flex gap-4">
                {["All", "Accepted", "Rejected"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab 
                        ? "border-[#004bca] text-[#004bca]" 
                        : "border-transparent text-[#737687] hover:text-[#191c1e]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pb-3">
                <button className="text-[#737687] hover:text-[#191c1e]"><Filter className="w-4 h-4" /></button>
                <button className="text-[#737687] hover:text-[#191c1e]"><MoreVertical className="w-4 h-4" /></button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 flex-1">
                <Loader2 className="w-6 h-6 animate-spin text-[#0061ff]" />
              </div>
            ) : (
              <>
                {/* Select All Row */}
                <div className="bg-[#f7f9fb] px-4 py-2 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedIds.size === filteredProspects.length && filteredProspects.length > 0} 
                      onCheckedChange={handleSelectAll} 
                    />
                    <span className="text-[10px] font-bold text-[#737687] uppercase tracking-wider">Select All Prospects</span>
                  </div>
                  <Badge variant="secondary" className="bg-[#e0e3e5] text-[#424656] text-[10px] font-bold">
                    {filteredProspects.length} TOTAL
                  </Badge>
                </div>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto">
                  {filteredProspects.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[#737687]">No prospects match this filter.</div>
                  ) : (
                    filteredProspects.map(prospect => {
                      const isActive = activeProspectId === prospect._id
                      const isSelected = selectedIds.has(prospect._id)
                      return (
                        <div 
                          key={prospect._id}
                          onClick={() => setActiveProspectId(prospect._id)}
                          className={`flex items-start gap-4 p-4 cursor-pointer border-l-4 transition-all border-b border-[#e0e3e5]/40 ${
                            isActive 
                              ? "border-l-[#004bca] bg-[#f4f7fc]" 
                              : "border-l-transparent hover:bg-[#f7f9fb]"
                          }`}
                        >
                          <div className="shrink-0 pt-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectProspect(prospect._id, !!checked)}
                              className="w-[18px] h-[18px] rounded data-[state=checked]:bg-[#004bca]"
                            />
                          </div>
                          
                          <div className="relative shrink-0">
                            <Avatar className="w-12 h-12 border border-[#e0e3e5]">
                              <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 text-sm font-bold">
                                {prospect.firstName?.[0]}{prospect.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full flex items-center justify-center ${prospect.isAccepted ? "bg-emerald-500" : "bg-red-500"}`}>
                              {prospect.isAccepted ? <CheckCheck className="w-2 h-2 text-white" /> : <X className="w-2 h-2 text-white" />}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-[#191c1e] text-sm truncate">
                                {prospect.firstName} {prospect.lastName}
                              </h4>
                              <Badge className={`px-1.5 py-0 text-[9px] uppercase shrink-0 ${getSeniorityColor(prospect.seniority)}`}>
                                {prospect.seniority?.replace("_", " ") || "NA"}
                              </Badge>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs text-[#565e74] truncate cursor-help">
                                    {prospect.title} at {companyName}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">{prospect.title} at {companyName}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {outreachMap[prospect._id] ? (
                              <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold uppercase ${
                                outreachMap[prospect._id].status === 'sent'
                                  ? 'text-emerald-600'
                                  : outreachMap[prospect._id].status === 'failed'
                                  ? 'text-red-500'
                                  : 'text-amber-600'
                              }`}>
                                {outreachMap[prospect._id].status === 'sent' ? (
                                  <><Send className="w-2.5 h-2.5" /> Email Sent</>
                                ) : outreachMap[prospect._id].status === 'failed' ? (
                                  <><AlertTriangle className="w-2.5 h-2.5" /> Email Failed</>
                                ) : (
                                  <><Clock className="w-2.5 h-2.5" /> Email Pending</>
                                )}
                              </div>
                            ) : !prospect.isEnriched ? (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 font-bold uppercase">
                                <RefreshCw className="w-2.5 h-2.5" /> Needs Enrichment
                              </div>
                            ) : null}
                          </div>
                          
                          {isActive && (
                            <div className="shrink-0 self-center pl-2">
                              <div className="w-8 h-8 rounded-full bg-[#dbe1ff] text-[#004bca] flex items-center justify-center">
                                <Mail className="w-4 h-4" />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
                
                {/* Sync & Enrich Buttons */}
                <div className="p-4 border-t bg-white shrink-0 space-y-2">
                  {/* Credit Blocked Alert */}
                  {enrichBlockedMsg && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-red-800">Enrichment Blocked</p>
                        <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">{enrichBlockedMsg}</p>
                      </div>
                      <button 
                        onClick={() => setEnrichBlockedMsg(null)} 
                        className="text-red-400 hover:text-red-600 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {selectedIds.size > 0 && Array.from(selectedIds).some(id => !prospects.find(p => p._id === id)?.isEnriched) && (
                    <button 
                      onClick={() => handleEnrich(Array.from(selectedIds).filter(id => !prospects.find(p => p._id === id)?.isEnriched))}
                      disabled={enriching || (creditStatus ? creditStatus.creditsRemaining <= 0 : false)}
                      className="w-full py-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm transition-colors flex items-center justify-center gap-2 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Enrich {Array.from(selectedIds).filter(id => !prospects.find(p => p._id === id)?.isEnriched).length} Selected
                    </button>
                  )}
                  <button className="w-full py-3 rounded-lg bg-[#f0f4ff] hover:bg-[#e0e7ff] text-[#004bca] font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Sync Prospect List ({selectedIds.size})
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Content: Details */}
          <div className="w-3/5 bg-white overflow-y-auto flex flex-col relative">
            {loading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-[#004bca]" />
               </div>
            ) : activeProspect ? (
              <div className="p-10 max-w-4xl mx-auto w-full">
                {/* Right Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <Avatar className="w-20 h-20 border border-[#e0e3e5]">
                      <AvatarFallback className="bg-gradient-to-br from-[#004bca] to-[#6b21dc] text-white text-2xl font-bold">
                        {activeProspect.firstName?.[0]}{activeProspect.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-3xl font-bold text-[#191c1e]">
                          {activeProspect.firstName} {activeProspect.lastName}
                        </h1>
                        <Badge className={`uppercase text-[11px] ${getSeniorityColor(activeProspect.seniority)}`}>
                          {activeProspect.seniority?.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-base font-medium text-[#565e74]">
                        {activeProspect.title} at <span className="text-[#004bca]">{companyName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {emailTemplate?.industry && (
                      <Badge className="bg-[#dbe1ff] text-[#004bca] border-[#004bca]/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide">
                        {emailTemplate.industry.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Location & Links */}
                <div className="flex items-center gap-6 mb-10 text-sm text-[#565e74]">
                  {activeProspect.prospectDetails?.location && (
                    <div className="flex items-center gap-2 font-medium">
                      <MapPin className="w-4 h-4 text-[#737687]" />
                      {activeProspect.prospectDetails.location}
                    </div>
                  )}
                  {activeProspect.prospectDetails?.linkedinUrl && (
                    <a href={activeProspect.prospectDetails.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#004bca] transition-colors font-medium">
                      <Linkedin className="w-4 h-4 text-[#737687]" />
                      linkedin.com/in/{activeProspect.firstName.toLowerCase()}{activeProspect.lastName.toLowerCase()}
                    </a>
                  )}
                </div>

                {/* Outreach Status Banner (if email was sent/failed/pending) */}
                {/* {outreachMap[activeProspect._id] && (
                    outreachMap[activeProspect._id].status === 'sent'
                      ? 'bg-emerald-50 border-emerald-200'
                      : outreachMap[activeProspect._id].status === 'failed'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      outreachMap[activeProspect._id].status === 'sent'
                        ? 'bg-emerald-100'
                        : outreachMap[activeProspect._id].status === 'failed'
                        ? 'bg-red-100'
                        : 'bg-amber-100'
                    }`}>
                      {outreachMap[activeProspect._id].status === 'sent' ? (
                        <Send className="w-5 h-5 text-emerald-600" />
                      ) : outreachMap[activeProspect._id].status === 'failed' ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${
                        outreachMap[activeProspect._id].status === 'sent'
                          ? 'text-emerald-800'
                          : outreachMap[activeProspect._id].status === 'failed'
                          ? 'text-red-800'
                          : 'text-amber-800'
                      }`}>
                        {outreachMap[activeProspect._id].status === 'sent'
                          ? 'Outreach Email Sent'
                          : outreachMap[activeProspect._id].status === 'failed'
                          ? 'Outreach Email Failed'
                          : 'Outreach Email Pending'}
                      </p>
                      <p className={`text-xs mt-0.5 ${
                        outreachMap[activeProspect._id].status === 'sent'
                          ? 'text-emerald-600'
                          : outreachMap[activeProspect._id].status === 'failed'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}>
                        {outreachMap[activeProspect._id].status === 'sent' && outreachMap[activeProspect._id].sentAt
                          ? `Delivered on ${new Date(outreachMap[activeProspect._id].sentAt!).toLocaleString()}`
                          : outreachMap[activeProspect._id].status === 'failed'
                          ? outreachMap[activeProspect._id].errorDetail || 'Send failed — use Retrigger to retry'
                          : `Last updated ${new Date(outreachMap[activeProspect._id].updatedAt).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                )} */}

                {/* Email Preview Section */}
                <div className="mb-10">
                  <h3 className="text-xs font-bold text-[#737687] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Outreach Mail Content
                  </h3>
                  
                  {activeProspect.isEnriched ? (
                    activeProspect.email ? (
                      <div className="border border-[#e0e3e5] rounded-xl overflow-hidden bg-white shadow-sm">
                        <div className="bg-[#f2f4f6] px-5 py-4 border-b flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-[#737687] font-medium">To:</span> 
                            <span className="font-bold text-[#004bca] bg-[#e0e7ff] px-2 py-1 rounded-md">{activeProspect.email}</span>
                          </div>
                          <button onClick={() => handleCopyEmail(activeProspect.email!)} className="text-[#565e74] hover:text-[#004bca] text-xs font-bold flex items-center gap-1.5 transition-colors">
                            {copiedEmail === activeProspect.email ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy Draft
                          </button>
                        </div>
                        <div 
                          className="p-4 bg-white overflow-y-auto max-h-[500px]"
                          style={{ width: '100%', maxWidth: '100%' }}
                        >
                          <div 
                            className="w-full"
                            style={{ 
                              transform: 'scale(0.85)',
                              transformOrigin: 'top left',
                              width: '117.65%', // 100 / 0.85
                              maxWidth: '117.65%'
                            }}
                            dangerouslySetInnerHTML={{
                              __html: emailTemplate?.template
                                ?.replace(/\{\{FIRST_NAME\}\}/g, activeProspect.firstName || "")
                                .replace(/\{\{JOB_POSTED_TITLE\}\}/g, jobTitle || "")
                                .replace(/\{\{COMPANY_NAME\}\}/g, companyName || "")
                                .replace(/\{\{BOOKING_LINK\}\}/g, "#")
                                .replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, "#")
                                || `Subject: Connect regarding ${jobTitle} at ${companyName}`
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 text-center border rounded-xl bg-[#f7f9fb] shadow-sm">
                        <Mail className="w-10 h-10 text-[#94a3b8] mx-auto mb-3" />
                        <p className="text-base font-bold text-[#424656]">No Verified Email</p>
                        <p className="text-sm text-[#737687] mt-1 max-w-sm mx-auto">This prospect fell back to manual outreach as a verified email could not be retrieved from the enrichment API.</p>
                      </div>
                    )
                  ) : (
                    <div className="p-10 text-center border-2 border-dashed border-amber-200 rounded-xl bg-amber-50/30 shadow-sm group">
                      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        <RefreshCw className={`w-8 h-8 text-amber-600 ${enriching ? 'animate-spin' : ''}`} />
                      </div>
                      <h4 className="text-lg font-bold text-amber-900 mb-2">Enrichment Required</h4>
                      <p className="text-sm text-amber-700/80 mb-6 max-w-md mx-auto">
                        This prospect's intelligence profile is currently limited. Enrich it now to unlock verified contact details and generate personalized outreach drafts.
                      </p>
                      {/* Credit blocked banner for single prospect */}
                      {enrichBlockedMsg && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-left mb-4 max-w-md mx-auto">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-red-600 leading-relaxed">{enrichBlockedMsg}</p>
                        </div>
                      )}
                      <button 
                        onClick={() => handleEnrich([activeProspect._id])}
                        disabled={enriching || (creditStatus ? creditStatus.creditsRemaining <= 0 : false)}
                        className="px-8 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-lg shadow-lg shadow-amber-200 transition-all flex items-center gap-3 mx-auto disabled:cursor-not-allowed"
                      >
                        {enriching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                        {enriching ? "Enriching intelligence..." : "Enrich Intelligence Profile"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Match Reasons */}
                {activeProspect.matchReasons && activeProspect.matchReasons.length > 0 && (
                   <div className="mb-10">
                      <h3 className="text-xs font-bold text-[#737687] uppercase tracking-widest mb-4">Key Highlights</h3>
                      <div className="flex flex-wrap gap-2">
                         {activeProspect.matchReasons.map((r, i) => (
                            <Badge key={i} variant="outline" className="bg-white border-[#e0e3e5] px-3 py-1 text-[#424656]">
                               {r.replace(/_/g, " ")}
                            </Badge>
                         ))}
                      </div>
                   </div>
                )}

                {/* Recent Activity */}
                <div>
                  <h3 className="text-xs font-bold text-[#737687] uppercase tracking-widest mb-3">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl border border-[#e0e3e5] bg-[#f7f9fb]">
                      <div className="w-10 h-10 rounded-full bg-[#dbe1ff] flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-[#004bca]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#191c1e]">Qualified via Validation</p>
                        <p className="text-xs text-[#565e74] mt-1">Matched automatically by Engine during Phase 3 scanning sequence.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[#f7f9fb]">
                <Users className="w-20 h-20 text-[#dbe1ff] mb-6" />
                <h3 className="text-2xl font-bold text-[#191c1e]">No Prospect Selected</h3>
                <p className="text-base text-[#565e74] max-w-md mt-3">Select a prospect from the left navigation pane to view their full intelligence dossier, verify details, and review tailored outreach emails.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

