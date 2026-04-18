"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Mail,
  Phone,
  Megaphone,
  Bot,
  Linkedin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { workflowProspects } from "@/lib/dummy-data"
import type { WorkflowAgent, WorkflowProspect, WorkflowHistoryItem } from "@/lib/types"

interface WorkflowDetailContentProps {
  workflow: WorkflowAgent
  onBack: () => void
}

const iconMap = {
  mail: Mail,
  phone: Phone,
  megaphone: Megaphone,
  bot: Bot,
  linkedin: Linkedin,
  calendar: Calendar,
}

const statusColors = {
  pending: { bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]", label: "Pending" },
  in_progress: { bg: "bg-[#0061ff]/10", text: "text-[#0061ff]", label: "In Progress" },
  completed: { bg: "bg-[#10b981]/10", text: "text-[#10b981]", label: "Completed" },
  failed: { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", label: "Failed" },
}

const historyStatusIcons = {
  success: CheckCircle,
  pending: Clock,
  failed: XCircle,
}

export function WorkflowDetailContent({ workflow, onBack }: WorkflowDetailContentProps) {
  const [selectedProspect, setSelectedProspect] = useState<WorkflowProspect | null>(null)
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false)
  
  const Icon = iconMap[workflow.icon]

  const handleViewHistory = (prospect: WorkflowProspect) => {
    setSelectedProspect(prospect)
    setIsHistoryPanelOpen(true)
  }

  const handleCloseHistory = () => {
    setIsHistoryPanelOpen(false)
    setSelectedProspect(null)
  }

  return (
    <div className="p-8 relative">
      <div className={`max-w-7xl mx-auto transition-all duration-300 ${isHistoryPanelOpen ? "mr-96" : ""}`}>
        {/* Back Button & Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 -ml-2 text-[#565e74] hover:text-[#191c1e]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${workflow.color}15` }}
              >
                <Icon className="w-8 h-8" style={{ color: workflow.color }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#191c1e]">{workflow.name}</h1>
                <p className="text-[#565e74]">{workflow.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#191c1e]">{workflow.prospectsCount}</p>
                <p className="text-xs text-[#94a3b8]">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#f59e0b]">{workflow.activeCount}</p>
                <p className="text-xs text-[#94a3b8]">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#10b981]">{workflow.completedCount}</p>
                <p className="text-xs text-[#94a3b8]">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prospects List */}
        <Card className="bg-white border-[#e0e3e5]">
          <CardHeader className="border-b border-[#e0e3e5]">
            <CardTitle className="text-lg font-semibold text-[#191c1e]">
              Connected Prospects
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e0e3e5] bg-[#f7f9fb]">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#565e74] font-medium">Prospect</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#565e74] font-medium">Company</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#565e74] font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#565e74] font-medium">Added</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#565e74] font-medium">Last Activity</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#565e74] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workflowProspects.map((prospect) => {
                  const status = statusColors[prospect.status]
                  return (
                    <tr 
                      key={prospect.id} 
                      className={`border-b border-[#f2f4f6] hover:bg-[#f7f9fb] transition-colors cursor-pointer ${
                        selectedProspect?.id === prospect.id ? "bg-[#0061ff]/5" : ""
                      }`}
                      onClick={() => handleViewHistory(prospect)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            {prospect.avatar ? (
                              <AvatarImage src={prospect.avatar} />
                            ) : null}
                            <AvatarFallback className="bg-[#0f172a] text-white text-sm">
                              {prospect.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-[#191c1e]">{prospect.name}</p>
                            <p className="text-xs text-[#94a3b8]">{prospect.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[#191c1e]">{prospect.company}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={`${status.bg} ${status.text} border-0 font-normal`}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[#565e74]">{prospect.addedAt}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[#565e74]">{prospect.lastActivity}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewHistory(prospect)
                          }}
                          className="text-[#0061ff] hover:text-[#004bca]"
                        >
                          View History
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* History Slide-out Panel */}
      <div 
        className={`fixed top-14 right-0 bottom-0 w-96 bg-white border-l border-[#e0e3e5] shadow-xl transform transition-transform duration-300 ease-in-out z-30 ${
          isHistoryPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedProspect && (
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="p-4 border-b border-[#e0e3e5] flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  {selectedProspect.avatar ? (
                    <AvatarImage src={selectedProspect.avatar} />
                  ) : null}
                  <AvatarFallback className="bg-[#0f172a] text-white">
                    {selectedProspect.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-[#191c1e]">{selectedProspect.name}</h3>
                  <p className="text-sm text-[#565e74]">{selectedProspect.title}</p>
                  <p className="text-xs text-[#94a3b8]">{selectedProspect.company}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleCloseHistory}
                className="text-[#565e74] hover:text-[#191c1e]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Status Badge */}
            <div className="px-4 py-3 border-b border-[#e0e3e5] bg-[#f7f9fb]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#565e74]">Current Status</span>
                <Badge className={`${statusColors[selectedProspect.status].bg} ${statusColors[selectedProspect.status].text} border-0`}>
                  {statusColors[selectedProspect.status].label}
                </Badge>
              </div>
            </div>

            {/* History Timeline */}
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-xs uppercase tracking-wider text-[#565e74] font-medium mb-4">
                Activity History
              </h4>
              <div className="space-y-4">
                {selectedProspect.history.map((item, index) => {
                  const StatusIcon = historyStatusIcons[item.status]
                  const statusColor = item.status === "success" ? "text-[#10b981]" : item.status === "pending" ? "text-[#f59e0b]" : "text-[#ef4444]"
                  const isLast = index === selectedProspect.history.length - 1
                  
                  return (
                    <div key={item.id} className="relative flex gap-3">
                      {/* Timeline Line */}
                      {!isLast && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-[#e0e3e5]" />
                      )}
                      
                      {/* Icon */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        item.status === "success" ? "bg-[#10b981]/10" : 
                        item.status === "pending" ? "bg-[#f59e0b]/10" : "bg-[#ef4444]/10"
                      }`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <p className="text-sm text-[#191c1e] font-medium">{item.action}</p>
                        <p className="text-xs text-[#94a3b8] mt-1">{item.timestamp}</p>
                        {item.details && (
                          <p className="text-xs text-[#565e74] mt-2 bg-[#f7f9fb] p-2 rounded">{item.details}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Panel Footer */}
            <div className="p-4 border-t border-[#e0e3e5] space-y-2">
              <Button className="w-full bg-[#0061ff] hover:bg-[#004bca] text-white">
                Send Follow-up
              </Button>
              <Button variant="outline" className="w-full">
                Remove from Workflow
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay when panel is open */}
      {isHistoryPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={handleCloseHistory}
        />
      )}
    </div>
  )
}
