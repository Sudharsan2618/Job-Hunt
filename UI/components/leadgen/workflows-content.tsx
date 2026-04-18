"use client"

import { useState } from "react"
import {
  Mail,
  Phone,
  Megaphone,
  Bot,
  Linkedin,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  X,
  Database,
  AtSign,
  PhoneCall,
  Network,
  Plus,
  UserPlus,
  Share2,
  PlusCircle,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { workflowAgents } from "@/lib/dummy-data"
import type { WorkflowAgent, Lead } from "@/lib/types"

interface WorkflowsContentProps {
  onSelectWorkflow: (workflow: WorkflowAgent) => void
  pendingLeads?: Lead[]
  onClearPendingLeads?: () => void
}

const iconMap = {
  mail: Mail,
  phone: Phone,
  megaphone: Megaphone,
  bot: Bot,
  linkedin: Linkedin,
  calendar: Calendar,
}

export function WorkflowsContent({ onSelectWorkflow, pendingLeads = [], onClearPendingLeads }: WorkflowsContentProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(pendingLeads.length > 0)
  const [selectedAgent, setSelectedAgent] = useState<WorkflowAgent | null>(null)

  const handleAssignToWorkflow = (workflow: WorkflowAgent) => {
    setSelectedAgent(workflow)
  }

  const handleConfirmAssignment = () => {
    alert(`Successfully assigned ${pendingLeads.length} prospects to ${selectedAgent?.name}!`)
    setShowAssignDialog(false)
    setSelectedAgent(null)
    onClearPendingLeads?.()
  }

  const handleCancelAssignment = () => {
    setShowAssignDialog(false)
    setSelectedAgent(null)
    onClearPendingLeads?.()
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* ── Header Section ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="page-heading">Workflow Gallery</h2>
            <p className="page-subtitle">
              Manage and deploy your specialized AI agents for automated lead curation.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#004bca] to-[#0061ff] text-white font-semibold rounded-xl shadow-lg hover:shadow-[#004bca]/20 active:scale-95 transition-all">
            <PlusCircle className="w-5 h-5" />
            Create New Agent
          </button>
        </div>

        {/* ── Featured Agent Bento Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-12">

          {/* Large Card: Data Enricher (4-col span) */}
          <div
            className="md:col-span-4 bg-white p-8 rounded-xl shadow-sm flex flex-col justify-between group cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectWorkflow(workflowAgents[0])}
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="flex items-center gap-2 px-3 py-1 bg-[#6b21dc]/10 text-[#6b21dc] text-[10px] font-bold uppercase tracking-widest rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#6b21dc] rounded-full animate-pulse" />
                  AI Active
                </span>
                <Database className="w-8 h-8 text-[#e0e3e5] group-hover:text-[#6b21dc] transition-colors" />
              </div>
              <h3 className="text-3xl font-bold text-[#191c1e] mb-2">Data Enricher</h3>
              <p className="text-[#424656] text-lg max-w-lg leading-relaxed">
                Scours 50+ data sources to provide deep firmographic and technographic insights for every lead found.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-12 p-6 bg-[#f7f9fb] rounded-xl border border-[#e0e3e5]/20">
              <div>
                <p className="stat-label mb-2">Prospects</p>
                <p className="text-3xl font-mono font-bold text-[#191c1e]">12,482</p>
              </div>
              <div>
                <p className="stat-label mb-2">Efficiency</p>
                <p className="text-3xl font-mono font-bold text-[#0061ff]">94.2%</p>
              </div>
              <div>
                <p className="stat-label mb-2">Last Active</p>
                <p className="text-xs font-bold text-[#424656] flex items-center gap-2 mt-4">
                  2 MINS AGO
                </p>
              </div>
            </div>
          </div>

          {/* Side Card: Email Outreach Agent (2-col span) */}
          <div
            className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectWorkflow(workflowAgents[0])}
          >
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <AtSign className="w-6 h-6 text-[#004bca]" />
              </div>
              <h3 className="text-xl font-bold text-[#191c1e]">Email Outreach Agent</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#424656] font-medium">Status</span>
                <span className="font-mono text-[#004bca] font-bold">RUNNING</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#424656] font-medium">Connected</span>
                <span className="font-mono text-[#191c1e]">4,102</span>
              </div>
              <div className="w-full bg-[#dbe1ff] h-1.5 rounded-full overflow-hidden mt-4">
                <div className="bg-[#004bca] h-full w-2/3 rounded-full" />
              </div>
            </div>
            <div className="mt-8">
              <p className="text-[10px] font-bold text-[#424656] uppercase tracking-widest">
                Active since 04:12 AM
              </p>
            </div>
          </div>

          {/* Gallery Card: Cold Call Assistant (2-col) */}
          <div
            className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectWorkflow(workflowAgents[1])}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#e0e3e5] font-bold text-[#424656]">
                PAUSED
              </span>
            </div>
            <h4 className="font-bold text-lg mb-2 text-[#191c1e]">Cold Call Assistant</h4>
            <p className="text-sm text-[#424656] mb-6">
              Automated voice scheduling and brief transcription for SDRs.
            </p>
            <div className="flex justify-between items-center border-t border-[#c2c6d9]/15 pt-4">
              <span className="text-xs font-mono text-[#191c1e]">892 Connected</span>
              <span className="text-xs text-[#424656]">Last active 4d ago</span>
            </div>
          </div>

          {/* Gallery Card: Campaign Manager (2-col) */}
          <div
            className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectWorkflow(workflowAgents[2])}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Network className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                ACTIVE
              </span>
            </div>
            <h4 className="font-bold text-lg mb-2 text-[#191c1e]">Campaign Manager</h4>
            <p className="text-sm text-[#424656] mb-6">
              Cross-channel orchestration and multi-touch sequencing.
            </p>
            <div className="flex justify-between items-center border-t border-[#c2c6d9]/15 pt-4">
              <span className="text-xs font-mono text-[#191c1e]">2,551 Connected</span>
              <span className="text-xs text-[#424656]">Last active 14m ago</span>
            </div>
          </div>

          {/* Deploy New Agent Card (2-col, dashed) */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border-2 border-dashed border-[#c2c6d9]/30 flex items-center justify-center group cursor-pointer hover:border-[#004bca]/30 transition-colors">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#f2f4f6] flex items-center justify-center mx-auto mb-3 group-hover:bg-[#dbe1ff] transition-colors">
                <Plus className="w-5 h-5 text-[#737687] group-hover:text-[#004bca] transition-colors" />
              </div>
              <p className="font-bold text-[#424656]">Deploy New Agent</p>
            </div>
          </div>

          {/* LinkedIn Connector Card (3-col) */}
          <div
            className="md:col-span-3 bg-white p-6 rounded-xl shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectWorkflow(workflowAgents[3])}
          >
            <div className="absolute top-0 right-0 p-4">
              <Share2 className="w-16 h-16 text-blue-200 opacity-20 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-1 text-[#191c1e]">LinkedIn Connector</h4>
              <p className="text-sm text-[#424656] mb-6 max-w-[240px]">
                Targeted connection requests and automated profile intelligence.
              </p>
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-[#eceef0] rounded-md">
                  <span className="text-[10px] block font-bold text-[#424656] uppercase tracking-tighter">
                    Status
                  </span>
                  <span className="text-sm font-mono font-bold text-[#191c1e]">READY</span>
                </div>
                <div className="px-3 py-1 bg-[#eceef0] rounded-md">
                  <span className="text-[10px] block font-bold text-[#424656] uppercase tracking-tighter">
                    Prospects
                  </span>
                  <span className="text-sm font-mono font-bold text-[#191c1e]">618</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Dark Banner (3-col) */}
          <div className="md:col-span-3 bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-6">
            <div className="flex-1">
              <h4 className="text-white font-bold text-lg mb-1">Agent Optimization Tip</h4>
              <p className="text-slate-400 text-sm">
                Your &quot;Data Enricher&quot; could be 12% more efficient with updated LinkedIn
                credentials.
              </p>
            </div>
            <button className="px-4 py-2 bg-white text-slate-900 text-xs font-black uppercase tracking-widest rounded-lg hover:bg-[#004bca] hover:text-white transition-all whitespace-nowrap">
              Fix Now
            </button>
          </div>
        </div>

        {/* ── Assign Dialog (when coming from Results with selected leads) ── */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0061ff]" />
                Assign Prospects to Workflow
              </DialogTitle>
              <DialogDescription>
                You have {pendingLeads.length} prospect{pendingLeads.length > 1 ? "s" : ""} ready
                to be assigned to a workflow agent.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {/* Selected Prospects Preview */}
              <div className="bg-[#f7f9fb] rounded-lg p-3 mb-4">
                <p className="text-xs uppercase tracking-wider text-[#565e74] mb-2">
                  Selected Prospects
                </p>
                <div className="flex flex-wrap gap-2">
                  {pendingLeads.slice(0, 5).map((lead) => (
                    <Badge key={lead.id} variant="outline" className="text-xs">
                      {lead.jobTitle}
                    </Badge>
                  ))}
                  {pendingLeads.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{pendingLeads.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Select Workflow */}
              <p className="text-sm font-medium text-[#191c1e] mb-3">Select a workflow agent:</p>
              <div className="grid grid-cols-2 gap-3">
                {workflowAgents.map((agent) => {
                  const Icon = iconMap[agent.icon]
                  const isSelected = selectedAgent?.id === agent.id
                  return (
                    <button
                      key={agent.id}
                      onClick={() => handleAssignToWorkflow(agent)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-[#0061ff] bg-[#0061ff]/5"
                          : "border-[#e0e3e5] hover:border-[#0061ff]/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${agent.color}15` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: agent.color }} />
                        </div>
                        <span className="text-sm font-medium text-[#191c1e]">{agent.name}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCancelAssignment}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAssignment}
                disabled={!selectedAgent}
                className="bg-[#0061ff] hover:bg-[#004bca] text-white"
              >
                Assign to {selectedAgent?.name || "Workflow"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
