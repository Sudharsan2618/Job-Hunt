"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle,
  ListFilter,
  Sparkles,
  Users,
  Upload,
  Search,
  ShieldCheck,
  TrendingUp,
  Pause,
  History,
  Maximize2,
  FolderOpen,
  Play,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { terminalLogs } from "@/lib/dummy-data"
import type { ProcessingStep, TerminalLog } from "@/lib/types"

interface ProcessingContentProps {
  onComplete: () => void
}

const processingSteps: ProcessingStep[] = [
  { id: 1, name: "Scraping Jobs", icon: "check", status: "completed" },
  { id: 2, name: "Qualifying Leads", icon: "filter", status: "active" },
  { id: 3, name: "AI Logic Mapping", icon: "sparkles", status: "pending" },
  { id: 4, name: "Prospecting", icon: "users", status: "pending" },
  { id: 5, name: "Syncing CRM", icon: "upload", status: "pending" },
]

export function ProcessingContent({ onComplete }: ProcessingContentProps) {
  const [progress, setProgress] = useState(38.4)
  const [jobsScraped, setJobsScraped] = useState(1248)
  const [leadsQualified, setLeadsQualified] = useState(412)
  const [logs, setLogs] = useState<TerminalLog[]>(terminalLogs)
  const [uptime, setUptime] = useState("00:14:22")
  const [isPaused, setIsPaused] = useState(false)

  // Simulate progress
  useEffect(() => {
    if (isPaused) return
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 1000)
          return 100
        }
        return prev + 0.5
      })
      setJobsScraped(prev => prev + Math.floor(Math.random() * 5))
      setLeadsQualified(prev => prev + Math.floor(Math.random() * 2))
    }, 500)

    return () => clearInterval(interval)
  }, [isPaused, onComplete])

  // Update uptime
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(prev => {
        const [h, m, s] = prev.split(":").map(Number)
        const totalSeconds = h * 3600 + m * 60 + s + 1
        const newH = Math.floor(totalSeconds / 3600)
        const newM = Math.floor((totalSeconds % 3600) / 60)
        const newS = totalSeconds % 60
        return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}:${String(newS).padStart(2, "0")}`
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Add new logs periodically
  useEffect(() => {
    if (isPaused) return
    
    const newLogMessages = [
      { type: "info" as const, message: "Analyzing job requirements for Software Engineer roles...", highlight: "Software Engineer" },
      { type: "success" as const, message: "Lead #8821 qualified. Criteria matched: 9.1/10 confidence score.", highlight: "#8821" },
      { type: "info" as const, message: "Connecting to Greenhouse API for startup positions...", highlight: "Greenhouse API" },
      { type: "ai_agent" as const, message: "Running semantic analysis on company culture descriptions...", highlight: undefined },
      { type: "info" as const, message: "Scanning executive profiles in tech sector...", highlight: undefined },
    ]

    const interval = setInterval(() => {
      const randomLog = newLogMessages[Math.floor(Math.random() * newLogMessages.length)]
      const now = new Date()
      const timestamp = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      
      setLogs(prev => [...prev.slice(-10), { ...randomLog, timestamp }])
    }, 3000)

    return () => clearInterval(interval)
  }, [isPaused])

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-white" />
      case "active":
        return <ListFilter className="w-5 h-5 text-[#0061ff]" />
      case "pending":
        switch (step.id) {
          case 3: return <Sparkles className="w-5 h-5 text-[#565e74]" />
          case 4: return <Users className="w-5 h-5 text-[#565e74]" />
          case 5: return <Upload className="w-5 h-5 text-[#565e74]" />
          default: return null
        }
    }
  }

  const getLogTypeBadge = (type: TerminalLog["type"]) => {
    switch (type) {
      case "info":
        return <span className="px-2 py-0.5 bg-[#0061ff]/20 text-[#0061ff] text-xs rounded font-medium">INFO</span>
      case "success":
        return <span className="px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] text-xs rounded font-medium">SUCCESS</span>
      case "ai_agent":
        return <span className="px-2 py-0.5 bg-[#6b21dc]/20 text-[#6b21dc] text-xs rounded font-medium">AI_AGENT</span>
      case "error":
        return <span className="px-2 py-0.5 bg-[#ba1a1a]/20 text-[#ba1a1a] text-xs rounded font-medium">ERROR</span>
      case "warning":
        return <span className="px-2 py-0.5 bg-[#f59e0b]/20 text-[#f59e0b] text-xs rounded font-medium">WARNING</span>
    }
  }

  const highlightText = (message: string, highlight?: string) => {
    if (!highlight) return <span className={logs[logs.length - 1]?.type === "ai_agent" ? "italic" : ""}>{message}</span>
    
    const parts = message.split(highlight)
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && <span className="font-semibold text-white">{highlight}</span>}
          </span>
        ))}
      </>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[#191c1e]">Vancouver Tech Talent Pipeline</h1>
              <Badge className="bg-[#0061ff]/10 text-[#0061ff] border-0">AI_PROCESSING</Badge>
            </div>
            <div className="flex items-center gap-2 text-[#565e74]">
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm">Project: Q3 Growth - Engineering Roles</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#0061ff] uppercase tracking-wider font-medium mb-1">Global Progress</p>
            <p className="text-2xl font-bold text-[#191c1e]">{progress.toFixed(1)}%</p>
            <div className="w-32 h-2 bg-[#e0e3e5] rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-[#0061ff] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Processing Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {processingSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  step.status === "completed" 
                    ? "bg-[#0061ff]" 
                    : step.status === "active"
                      ? "border-2 border-[#0061ff] bg-white"
                      : "border border-[#e0e3e5] bg-white"
                }`}>
                  {getStepIcon(step)}
                </div>
                <p className={`mt-2 text-xs uppercase tracking-wider font-medium ${
                  step.status === "active" ? "text-[#0061ff]" : "text-[#565e74]"
                }`}>
                  {step.status === "active" ? "Active Step" : `Step ${step.id}`}
                </p>
                <p className={`text-sm font-medium ${
                  step.status === "pending" ? "text-[#94a3b8]" : "text-[#191c1e]"
                }`}>
                  {step.name}
                </p>
              </div>
              {index < processingSteps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step.status === "completed" ? "bg-[#0061ff]" : "bg-[#e0e3e5]"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-[#0061ff] font-medium">Jobs Scraped</p>
              <Search className="w-4 h-4 text-[#94a3b8]" />
            </div>
            <p className="text-3xl font-bold text-[#191c1e]">{jobsScraped.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-[#10b981]" />
              <span className="text-xs text-[#10b981] font-medium">SCANNING LIVE</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-[#0061ff] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-[#0061ff] font-medium">Leads Qualified</p>
              <ShieldCheck className="w-4 h-4 text-[#0061ff]" />
            </div>
            <p className="text-3xl font-bold text-[#191c1e]">{leadsQualified}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-[#10b981]" />
              <span className="text-xs text-[#10b981] font-medium">33% CONVERSION</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-[#565e74] font-medium">AI Queries</p>
              <Sparkles className="w-4 h-4 text-[#94a3b8]" />
            </div>
            <p className="text-3xl font-bold text-[#94a3b8]">0</p>
            <p className="text-xs text-[#94a3b8] mt-2">QUEUED FOR STEP 3</p>
          </div>

          <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-[#565e74] font-medium">Prospects Found</p>
              <Users className="w-4 h-4 text-[#94a3b8]" />
            </div>
            <p className="text-3xl font-bold text-[#94a3b8]">0</p>
            <p className="text-xs text-[#94a3b8] mt-2">WAITING...</p>
          </div>
        </div>

        {/* Terminal */}
        <div className="bg-[#0f172a] rounded-xl overflow-hidden">
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b]">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                <div className="w-3 h-3 rounded-full bg-[#10b981]" />
              </div>
              <div className="flex items-center gap-2 text-[#94a3b8]">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AGENT TERMINAL V2.4.0</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#64748b]">UPTIME: {uptime}</span>
              <button className="text-[#64748b] hover:text-white">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-4 font-mono text-sm h-64 overflow-y-auto no-scrollbar">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-4 mb-3">
                <span className="text-[#64748b] shrink-0">{log.timestamp}</span>
                {getLogTypeBadge(log.type)}
                <span className={`text-[#94a3b8] ${log.type === "ai_agent" ? "italic" : ""}`}>
                  {highlightText(log.message, log.highlight)}
                  {index === logs.length - 1 && (
                    <span className="inline-block w-2 h-4 bg-[#0061ff] ml-1 animate-pulse" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 text-[#565e74]">
            <span className="w-2 h-2 rounded-full bg-[#0061ff]" />
            <span className="text-sm">Estimated completion: <strong className="text-[#191c1e]">12 minutes</strong></span>
          </div>
          <p className="text-xs text-[#94a3b8]">2026 Agamx LeadGen Platform. All agents active.</p>
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-3">
          <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-[#565e74] hover:text-[#191c1e] border border-[#e0e3e5]">
            <History className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center ${
              isPaused ? "bg-[#10b981] text-white" : "bg-[#ba1a1a] text-white"
            }`}
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  )
}
