"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
import {
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  Trash2,
  Wand2,
  Mail,
  Phone,
  Megaphone,
  Bot,
  Linkedin,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ArrowUpAZ,
  ArrowDownAZ,
  Group,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { workflowAgents } from "@/lib/dummy-data"
import type { WorkflowAgent } from "@/lib/types"
import { fetchAllJobs, type RunJob } from "@/lib/api"
import { CheckSquare } from "lucide-react"

interface ResultsContentProps {
  onViewProspect: (prospect: any) => void
}

const workflowIconMap = {
  mail: Mail,
  phone: Phone,
  megaphone: Megaphone,
  bot: Bot,
  linkedin: Linkedin,
  calendar: Calendar,
}

// Sort modes cycle: none → asc → desc → grouped → none
type SortMode = "none" | "asc" | "desc" | "grouped"

interface ColumnSort {
  field: string
  mode: SortMode
}

// Sortable columns config
const SORTABLE_COLUMNS = ["title", "company", "location", "qualityStatus", "boardName"]

export function ResultsContent({ onViewProspect }: ResultsContentProps) {
  const [jobs, setJobs] = useState<RunJob[]>([])
  const [displayJobs, setDisplayJobs] = useState<RunJob[]>([])
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sort state
  const [columnSort, setColumnSort] = useState<ColumnSort>({ field: "createdAt", mode: "desc" })

  // Workflow assignment state
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false)
  const [selectedWorkflowAgent, setSelectedWorkflowAgent] = useState<WorkflowAgent | null>(null)

  // Fetch jobs from the API
  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // For grouped mode, we fetch all and sort client-side
      let sortBy: string | undefined
      let sortOrder: string | undefined

      if (columnSort.mode === "asc") {
        sortBy = columnSort.field
        sortOrder = "asc"
      } else if (columnSort.mode === "desc") {
        sortBy = columnSort.field
        sortOrder = "desc"
      } else if (columnSort.mode === "grouped") {
        // For grouped, still sort server-side A-Z, then we group client-side
        sortBy = columnSort.field
        sortOrder = "asc"
      } else {
        sortBy = "createdAt"
        sortOrder = "desc"
      }

      const data = await fetchAllJobs(currentPage, rowsPerPage, sortBy, sortOrder)
      setJobs(data.jobs)
      setTotalResults(data.total)
      setTotalPages(data.pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs")
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage, columnSort])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  // Apply client-side grouping when mode is "grouped"
  useEffect(() => {
    if (columnSort.mode === "grouped" && jobs.length > 0) {
      const field = columnSort.field as keyof RunJob
      const grouped = [...jobs].sort((a, b) => {
        const aVal = (getJobFieldValue(a, field) || "").toString().toLowerCase()
        const bVal = (getJobFieldValue(b, field) || "").toString().toLowerCase()
        return aVal.localeCompare(bVal)
      })
      setDisplayJobs(grouped)
    } else {
      setDisplayJobs(jobs)
    }
  }, [jobs, columnSort])

  // Helper to get a field value from a job for sorting/grouping
  function getJobFieldValue(job: RunJob, field: string): string {
    switch (field) {
      case "title": return job.title || ""
      case "company": return job.company || ""
      case "location": return job.location || ""
      case "qualityStatus": return job.qualityStatus || ""
      case "boardName": return job.boardName || ""
      default: return ""
    }
  }

  const handleExportCSV = () => {
    const headers = ["Title", "Company", "Location", "Job Board", "Quality", "Posted Date", "Job URL", "Company URL"]
    const csvRows = [headers.join(",")]
    displayJobs.forEach((job) => {
      csvRows.push([
        `"${(job.title || "").replace(/"/g, '""')}"`,
        `"${(job.company || "").replace(/"/g, '""')}"`,
        `"${(job.location || "").replace(/"/g, '""')}"`,
        `"${(job.boardName || "").replace(/"/g, '""')}"`,
        `"${(job.qualityStatus || "").replace(/"/g, '""')}"`,
        `"${job.createdAt || ""}"`,
        `"${job.jobDetails?.jobUrl || ""}"`,
        `"${job.jobDetails?.companyUrl || ""}"`,
      ].join(","))
    })
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "jobs-export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSelectJob = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedJobs.size === displayJobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(displayJobs.map((j) => j._id)))
    }
  }

  const handleClearSelection = () => {
    setSelectedJobs(new Set())
  }

  const handleOpenWorkflowDialog = () => {
    setShowWorkflowDialog(true)
  }

  const handleConfirmWorkflowAssignment = () => {
    if (selectedWorkflowAgent) {
      alert(
        `Successfully assigned ${selectedJobs.size} job${selectedJobs.size > 1 ? "s" : ""} to ${selectedWorkflowAgent.name}!`
      )
      setShowWorkflowDialog(false)
      setSelectedWorkflowAgent(null)
      setSelectedJobs(new Set())
    }
  }

  // Sort cycling: none → asc → desc → grouped → none
  const handleColumnSort = (field: string) => {
    setColumnSort((prev) => {
      if (prev.field !== field) {
        return { field, mode: "asc" }
      }
      const nextMode: Record<SortMode, SortMode> = {
        none: "asc",
        asc: "desc",
        desc: "grouped",
        grouped: "none",
      }
      return { field, mode: nextMode[prev.mode] }
    })
    setCurrentPage(1)
  }

  // Direct sort mode selection from dropdown
  const handleDirectSort = (field: string, mode: SortMode) => {
    setColumnSort({ field, mode })
    setCurrentPage(1)
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200"
      case "good":
        return "bg-blue-50 text-blue-700 border border-blue-200"
      case "fair":
        return "bg-amber-50 text-amber-700 border border-amber-200"
      case "poor":
        return "bg-red-50 text-red-600 border border-red-200"
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200"
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—"
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch {
      return dateStr
    }
  }

  // Get sort icon for a column
  const getSortIndicator = (field: string) => {
    if (columnSort.field !== field || columnSort.mode === "none") {
      return <ChevronsUpDown className="w-3 h-3 text-[#b0b3c0]" />
    }
    switch (columnSort.mode) {
      case "asc":
        return <ChevronUp className="w-3 h-3 text-[#004bca]" />
      case "desc":
        return <ChevronDown className="w-3 h-3 text-[#004bca]" />
      case "grouped":
        return <Group className="w-3 h-3 text-[#004bca]" />
      default:
        return <ChevronsUpDown className="w-3 h-3 text-[#b0b3c0]" />
    }
  }

  // Render a sortable column header
  const renderSortableHeader = (label: string, field: string, extraClass = "") => {
    const isSortable = SORTABLE_COLUMNS.includes(field)
    if (!isSortable) {
      return (
        <th className={`px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider ${extraClass}`}>
          {label}
        </th>
      )
    }

    return (
      <th className={`px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider ${extraClass}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 hover:text-[#004bca] transition-colors focus:outline-none group">
              <span>{label}</span>
              {getSortIndicator(field)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            <DropdownMenuItem
              onClick={() => handleDirectSort(field, "asc")}
              className={`flex items-center gap-2 text-xs ${columnSort.field === field && columnSort.mode === "asc" ? "bg-[#004bca]/5 text-[#004bca] font-bold" : ""}`}
            >
              <ArrowUpAZ className="w-3.5 h-3.5" />
              Sort A → Z
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDirectSort(field, "desc")}
              className={`flex items-center gap-2 text-xs ${columnSort.field === field && columnSort.mode === "desc" ? "bg-[#004bca]/5 text-[#004bca] font-bold" : ""}`}
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              Sort Z → A
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDirectSort(field, "grouped")}
              className={`flex items-center gap-2 text-xs ${columnSort.field === field && columnSort.mode === "grouped" ? "bg-[#004bca]/5 text-[#004bca] font-bold" : ""}`}
            >
              <Group className="w-3.5 h-3.5" />
              Word Grouping
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </th>
    )
  }

  const startRow = (currentPage - 1) * rowsPerPage + 1
  const endRow = Math.min(currentPage * rowsPerPage, totalResults)

  // Detect group boundaries for visual separators in "grouped" mode
  const getGroupLabel = (job: RunJob, index: number): string | null => {
    if (columnSort.mode !== "grouped") return null
    const field = columnSort.field
    const currentVal = getJobFieldValue(job, field).toLowerCase()
    if (index === 0) return currentVal
    const prevVal = getJobFieldValue(displayJobs[index - 1], field).toLowerCase()
    if (currentVal !== prevVal) return currentVal
    return null
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Header Section ── */}
      <header className="bg-white px-6 py-4 border-b border-[#e0e3e5]/20 flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div>
          <h1 className="page-heading !text-xl">Results Dashboard</h1>
          <p className="page-subtitle">Analyzing top-performing lead matches.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e6e8ea] rounded-lg text-xs font-semibold text-[#191c1e] hover:bg-[#e0e3e5] transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </header>

      {/* ── Results Table ── */}
      <section className="flex-1 overflow-auto bg-white relative">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-[#004bca]" />
            <span className="ml-2 text-sm text-[#737687]">Loading jobs...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <button
                onClick={loadJobs}
                className="mt-2 text-xs text-[#004bca] font-bold hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-[#737687]">No jobs found.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="bg-slate-50 border-b border-[#c2c6d9]/20">
                <th className="px-4 py-3 w-10">
                  <Checkbox
                    checked={selectedJobs.size === displayJobs.length && displayJobs.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                {renderSortableHeader("Title", "title", "min-w-[220px]")}
                {renderSortableHeader("Company", "company", "min-w-[160px]")}
                {renderSortableHeader("Location", "location", "w-44")}
                {renderSortableHeader("Job Board", "boardName", "w-28")}
                {renderSortableHeader("Quality", "qualityStatus", "w-24")}
                <th className="px-4 py-3 text-[10px] font-bold text-[#737687] uppercase tracking-wider w-28">
                  Posted Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c2c6d9]/10">
              {displayJobs.map((job, index) => {
                const groupLabel = getGroupLabel(job, index)
                return (
                  <Fragment key={job._id}>
                    {groupLabel && columnSort.mode === "grouped" && index > 0 && (
                      <tr key={`group-${index}`} className="bg-[#f7f8fa]">
                        <td colSpan={7} className="px-4 py-1.5">
                          <span className="text-[10px] font-bold text-[#004bca] uppercase tracking-wider">
                            {groupLabel}
                          </span>
                        </td>
                      </tr>
                    )}
                    <tr
                      key={job._id + "-" + index}
                      className={`hover:bg-[#004bca]/5 transition-colors group ${
                        selectedJobs.has(job._id) ? "bg-[#004bca]/5" : ""
                      }`}
                    >
                      <td className="px-4 py-2">
                        <Checkbox
                          checked={selectedJobs.has(job._id)}
                          onCheckedChange={() => handleSelectJob(job._id)}
                        />
                      </td>
                      {/* Title — hyperlinked to jobUrl */}
                      <td className="px-4 py-2">
                        {job.jobDetails?.jobUrl ? (
                          <a
                            href={job.jobDetails.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-[#004bca] text-xs truncate max-w-[300px] block hover:underline"
                            title={job.title}
                          >
                            {job.title}
                          </a>
                        ) : (
                          <span className="font-bold text-[#191c1e] text-xs truncate max-w-[300px] block">
                            {job.title}
                          </span>
                        )}
                      </td>
                      {/* Company — hyperlinked to companyUrl */}
                      <td className="px-4 py-2">
                        {job.jobDetails?.companyUrl ? (
                          <a
                            href={job.jobDetails.companyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-xs text-[#004bca] truncate max-w-[150px] block hover:underline"
                            title={job.company}
                          >
                            {job.company}
                          </a>
                        ) : (
                          <span className="font-medium text-xs text-[#191c1e] truncate max-w-[150px] block">
                            {job.company}
                          </span>
                        )}
                      </td>
                      {/* Location */}
                      <td className="px-4 py-2">
                        <span className="bg-[#e6e8ea] px-2 py-0.5 rounded text-[10px] font-medium text-[#424656]">
                          {job.location}
                        </span>
                      </td>
                      {/* Job Board */}
                      <td className="px-4 py-2">
                        <span className="bg-[#dae2fd] text-[#3f465c] text-[10px] px-1.5 py-0.5 rounded font-bold capitalize">
                          {job.boardName || "—"}
                        </span>
                      </td>
                      {/* Quality */}
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold capitalize ${getQualityColor(
                            job.qualityStatus
                          )}`}
                        >
                          {job.qualityStatus || "—"}
                        </span>
                      </td>
                      {/* Posted Date */}
                      <td className="px-4 py-2 text-[10px] font-mono text-[#737687]">
                        {formatDate(job.createdAt)}
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Sticky Pagination Footer ── */}
      <footer className="bg-white px-6 py-3 border-t border-[#e0e3e5]/20 flex justify-between items-center z-30">
        <div className="flex items-center gap-4 text-[11px] font-medium text-[#737687]">
          <span>Rows:</span>
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(v) => {
              setRowsPerPage(Number(v))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-14 h-6 text-[11px] bg-transparent border-none p-0 font-bold text-[#191c1e]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-2 border-l border-[#c2c6d9]/30 pl-4">
            {totalResults > 0 ? `${startRow}-${endRow} of ${totalResults.toLocaleString()} results` : "0 results"}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            className="p-1 rounded-lg hover:bg-[#e0e3e5] text-[#737687] disabled:opacity-30"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Show pages around the current page
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all ${
                  currentPage === pageNum
                    ? "bg-[#004bca] text-white shadow-sm"
                    : "hover:bg-[#e0e3e5] text-[#737687]"
                }`}
              >
                {pageNum}
              </button>
            )
          })}
          <button
            className="p-1 rounded-lg hover:bg-[#e0e3e5] text-[#737687] disabled:opacity-30"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ── Floating Selection Action Bar ── */}
      <div
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] transform transition-all duration-300 ${
          selectedJobs.size > 0
            ? "translate-y-0 opacity-100"
            : "translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-slate-900 text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 border border-white/10">
          <div className="flex items-center gap-3 pr-6 border-r border-white/20">
            <span className="bg-[#004bca] px-2 py-0.5 rounded text-xs font-bold">
              {selectedJobs.size}
            </span>
            <span className="text-xs font-medium">Items selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenWorkflowDialog}
              className="flex items-center gap-2 bg-[#004bca] hover:bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-[#004bca]/20"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Configure to Workflow Agent
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearSelection}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Workflow Assignment Dialog (in-page, no navigation) ── */}
      <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-[#004bca]" />
              Assign to Workflow Agent
            </DialogTitle>
            <DialogDescription>
              Assign {selectedJobs.size} selected job
              {selectedJobs.size > 1 ? "s" : ""} to an AI workflow agent for automated
              outreach.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Selected count preview */}
            <div className="bg-[#f2f4f6] rounded-lg p-3 mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#004bca] flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#191c1e]">
                  {selectedJobs.size} job{selectedJobs.size > 1 ? "s" : ""} selected
                </p>
                <p className="text-[10px] text-[#737687]">
                  Ready for workflow assignment
                </p>
              </div>
            </div>

            {/* Select Workflow Agent */}
            <p className="text-xs font-bold text-[#737687] uppercase tracking-wider mb-3">
              Select a workflow agent
            </p>
            <div className="grid grid-cols-2 gap-3">
              {workflowAgents.map((agent) => {
                const Icon = workflowIconMap[agent.icon]
                const isSelected = selectedWorkflowAgent?.id === agent.id
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedWorkflowAgent(agent)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-[#004bca] bg-[#004bca]/5 shadow-sm"
                        : "border-[#e0e3e5] hover:border-[#004bca]/50 hover:bg-[#f7f9fb]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${agent.color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: agent.color }} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#191c1e] block">
                          {agent.name}
                        </span>
                        <span className="text-[10px] text-[#737687]">
                          {agent.prospectsCount} prospects
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#e0e3e5]">
            <Button
              variant="outline"
              onClick={() => {
                setShowWorkflowDialog(false)
                setSelectedWorkflowAgent(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmWorkflowAssignment}
              disabled={!selectedWorkflowAgent}
              className="bg-[#004bca] hover:bg-[#003ea8] text-white gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Assign to {selectedWorkflowAgent?.name || "Workflow"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
