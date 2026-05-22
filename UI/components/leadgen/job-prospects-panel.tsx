"use client"

import { useState, useEffect, useMemo } from "react"
import {
  X,
  Linkedin,
  MapPin,
  Mail,
  Copy,
  CheckCheck,
  Users,
  Loader2,
  Briefcase,
  Filter,
  MoreVertical,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { fetchJobProspects, type JobProspect } from "@/lib/api"

interface JobProspectsPanelProps {
  isOpen: boolean
  onClose: () => void
  jobId: string | null
  jobTitle: string
  companyName: string
  runId: string
  onProspectsSelected?: (jobId: string, prospectIds: string[], prospectsData: any[]) => void
}

export function JobProspectsPanel({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  runId,
  onProspectsSelected,
}: JobProspectsPanelProps) {
  const [prospects, setProspects] = useState<JobProspect[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"All" | "Accepted" | "Rejected">("All")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeProspectId, setActiveProspectId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !jobId) return
    setSelectedIds(new Set())
    setLoading(true)
    fetchJobProspects(jobId)
      .then((d) => {
        setProspects(d.prospects)
        if (d.prospects.length > 0) setActiveProspectId(d.prospects[0]._id)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [isOpen, jobId])

  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      if (activeTab === "All") return true
      if (activeTab === "Accepted") return p.isAccepted
      if (activeTab === "Rejected") return !p.isAccepted
      return true
    })
  }, [prospects, activeTab])

  useEffect(() => {
    if (activeProspectId) {
      const stillVisible = filteredProspects.find((p) => p._id === activeProspectId)
      if (!stillVisible && filteredProspects.length > 0) {
        setActiveProspectId(filteredProspects[0]._id)
      }
    }
  }, [filteredProspects, activeProspectId])

  const activeProspect = useMemo(
    () => prospects.find((p) => p._id === activeProspectId),
    [prospects, activeProspectId]
  )

  const handleSelectAll = (checked: boolean) => {
    const next = checked ? new Set(filteredProspects.map((p) => p._id)) : new Set<string>()
    setSelectedIds(next)
    onProspectsSelected?.(jobId || "", [...next], prospects)
  }
  const handleSelectProspect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
    onProspectsSelected?.(jobId || "", [...next], prospects)
  }
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  const getSeniorityColor = (seniority: string | undefined) => {
    const colors: Record<string, string> = {
      c_suite: "bg-violet-100 text-violet-700 border-violet-200",
      vp: "bg-blue-100 text-blue-700 border-blue-200",
      director: "bg-emerald-100 text-emerald-700 border-emerald-200",
      head: "bg-amber-100 text-amber-700 border-amber-200",
      manager: "bg-slate-100 text-slate-600 border-slate-200",
    }
    return colors[(seniority || "").toLowerCase()] || "bg-slate-100 text-slate-600 border-slate-200"
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 bottom-0 w-[95vw] max-w-5xl bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#e0e3e5] px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dbe1ff] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#004bca]" />
            </div>
            <div>
              <h2 className="font-bold text-[#191c1e] text-lg">Prospects</h2>
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

        <div className="bg-[#f7f9fb] px-6 py-3 border-b shrink-0">
          <div className="flex items-start gap-3">
            <Briefcase className="w-4 h-4 text-[#004bca] mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#191c1e] truncate">{jobTitle}</p>
              <p className="text-xs text-[#737687]">{companyName}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-2/5 flex flex-col border-r border-[#e0e3e5] bg-white">
            <div className="flex items-center justify-between px-4 pt-3 border-b shrink-0">
              <div className="flex gap-4">
                {(["All", "Accepted", "Rejected"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
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
                <button className="text-[#737687] hover:text-[#191c1e]">
                  <Filter className="w-4 h-4" />
                </button>
                <button className="text-[#737687] hover:text-[#191c1e]">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 flex-1">
                <Loader2 className="w-6 h-6 animate-spin text-[#0061ff]" />
              </div>
            ) : (
              <>
                <div className="bg-[#f7f9fb] px-4 py-2 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={
                        selectedIds.size === filteredProspects.length && filteredProspects.length > 0
                      }
                      onCheckedChange={(c) => handleSelectAll(!!c)}
                    />
                    <span className="text-[10px] font-bold text-[#737687] uppercase tracking-wider">
                      Select All Prospects
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-[#e0e3e5] text-[#424656] text-[10px] font-bold"
                  >
                    {filteredProspects.length} TOTAL
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredProspects.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[#737687]">
                      No prospects match this filter.
                    </div>
                  ) : (
                    filteredProspects.map((prospect) => {
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
                              onCheckedChange={(c) =>
                                handleSelectProspect(prospect._id, !!c)
                              }
                              className="w-[18px] h-[18px] rounded data-[state=checked]:bg-[#004bca]"
                            />
                          </div>
                          <div className="relative shrink-0">
                            <Avatar className="w-12 h-12 border border-[#e0e3e5]">
                              <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 text-sm font-bold">
                                {prospect.firstName?.[0]}
                                {prospect.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full flex items-center justify-center ${
                                prospect.isAccepted ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            >
                              {prospect.isAccepted ? (
                                <CheckCheck className="w-2 h-2 text-white" />
                              ) : (
                                <X className="w-2 h-2 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-[#191c1e] text-sm truncate">
                                {prospect.firstName} {prospect.lastName}
                              </h4>
                              <Badge
                                className={`px-1.5 py-0 text-[9px] uppercase shrink-0 ${getSeniorityColor(
                                  prospect.seniority
                                )}`}
                              >
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
                                  <p className="text-xs">
                                    {prospect.title} at {companyName}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {!prospect.isEnriched && (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 font-bold uppercase">
                                Needs Enrichment
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>

          <div className="w-3/5 bg-white overflow-y-auto flex flex-col relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#004bca]" />
              </div>
            ) : activeProspect ? (
              <div className="p-10 max-w-4xl mx-auto w-full">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <Avatar className="w-20 h-20 border border-[#e0e3e5]">
                      <AvatarFallback className="bg-gradient-to-br from-[#004bca] to-[#6b21dc] text-white text-2xl font-bold">
                        {activeProspect.firstName?.[0]}
                        {activeProspect.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-3xl font-bold text-[#191c1e]">
                          {activeProspect.firstName} {activeProspect.lastName}
                        </h1>
                        <Badge
                          className={`uppercase text-[11px] ${getSeniorityColor(
                            activeProspect.seniority
                          )}`}
                        >
                          {activeProspect.seniority?.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-base font-medium text-[#565e74]">
                        {activeProspect.title} at <span className="text-[#004bca]">{companyName}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-10 text-sm text-[#565e74]">
                  {activeProspect.prospectDetails?.location && (
                    <div className="flex items-center gap-2 font-medium">
                      <MapPin className="w-4 h-4 text-[#737687]" />
                      {activeProspect.prospectDetails.location}
                    </div>
                  )}
                  {activeProspect.prospectDetails?.linkedinUrl && (
                    <a
                      href={activeProspect.prospectDetails.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 hover:text-[#004bca] transition-colors font-medium"
                    >
                      <Linkedin className="w-4 h-4 text-[#737687]" />
                      LinkedIn profile
                    </a>
                  )}
                </div>

                <div className="mb-10">
                  <h3 className="text-xs font-bold text-[#737687] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Contact
                  </h3>
                  {activeProspect.email ? (
                    <div className="border border-[#e0e3e5] rounded-xl overflow-hidden bg-white shadow-sm">
                      <div className="bg-[#f2f4f6] px-5 py-4 border-b flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-[#737687] font-medium">Email:</span>
                          <span className="font-bold text-[#004bca] bg-[#e0e7ff] px-2 py-1 rounded-md">
                            {activeProspect.email}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyEmail(activeProspect.email!)}
                          className="text-[#565e74] hover:text-[#004bca] text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          {copiedEmail === activeProspect.email ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Copy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-10 text-center border-2 border-dashed border-amber-200 rounded-xl bg-amber-50/30">
                      <Mail className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                      <p className="text-base font-bold text-amber-900">No verified email</p>
                      <p className="text-sm text-amber-700/80 mt-1 max-w-md mx-auto">
                        Apollo enrichment is on-demand and disabled in this iteration. Email will
                        appear here once enrichment is enabled.
                      </p>
                    </div>
                  )}
                </div>

                {activeProspect.matchReasons && activeProspect.matchReasons.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-xs font-bold text-[#737687] uppercase tracking-widest mb-4">
                      Match Reasons
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {activeProspect.matchReasons.map((r, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-white border-[#e0e3e5] px-3 py-1 text-[#424656]"
                        >
                          {r.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!activeProspect.isAccepted && activeProspect.rejectionReason && (
                  <div className="mb-10">
                    <h3 className="text-xs font-bold text-[#737687] uppercase tracking-widest mb-4">
                      Rejection Reason
                    </h3>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                      {activeProspect.rejectionReason}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[#f7f9fb]">
                <Users className="w-20 h-20 text-[#dbe1ff] mb-6" />
                <h3 className="text-2xl font-bold text-[#191c1e]">No prospect selected</h3>
                <p className="text-base text-[#565e74] max-w-md mt-3">
                  Pick a prospect from the left to view their details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
