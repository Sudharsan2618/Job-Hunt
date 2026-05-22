"use client"

import { X, Mail } from "lucide-react"

interface OutreachStatusPanelProps {
  isOpen: boolean
  runId: string
  onClose: () => void
}

export function OutreachStatusPanel({ isOpen, runId, onClose }: OutreachStatusPanelProps) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 bottom-0 w-[420px] bg-white z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#e0e3e5] px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dbe1ff] flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#004bca]" />
            </div>
            <div>
              <h2 className="font-bold text-[#191c1e] text-lg">Outreach Status</h2>
              <p className="text-xs text-[#737687]">Run {runId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#f2f4f6] text-[#565e74] hover:text-[#191c1e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-[#f7f9fb]">
          <Mail className="w-16 h-16 text-[#dbe1ff] mb-6" />
          <h3 className="text-xl font-bold text-[#191c1e] mb-2">Outreach not enabled</h3>
          <p className="text-sm text-[#565e74] max-w-xs">
            Email outreach will be wired in a future iteration. Prospects are collected and stored
            in the database.
          </p>
        </div>
      </div>
    </>
  )
}
