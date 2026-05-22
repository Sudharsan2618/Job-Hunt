"use client"

import { useState } from "react"
import {
  X,
  Share2,
  Plus,
  Linkedin,
  MapPin,
  Sparkles,
  Mail,
  Phone,
  Search,
  Copy,
  CheckCheck,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { mockApi } from "@/lib/dummy-data"
import type { Prospect } from "@/lib/types"

interface ProspectDetailsModalProps {
  prospect: Prospect | null
  isOpen: boolean
  onClose: () => void
}

export function ProspectDetailsModal({ prospect, isOpen, onClose }: ProspectDetailsModalProps) {
  const [emailCopied, setEmailCopied] = useState(false)
  const [isAddingToCampaign, setIsAddingToCampaign] = useState(false)
  const [isMarkingContacted, setIsMarkingContacted] = useState(false)

  if (!isOpen || !prospect) return null

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(prospect.contactInfo.email)
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 2000)
  }

  const handleAddToCampaign = async () => {
    setIsAddingToCampaign(true)
    await mockApi.addToCampaign(prospect.id)
    setIsAddingToCampaign(false)
    alert("Added to campaign!")
  }

  const handleMarkContacted = async () => {
    setIsMarkingContacted(true)
    await mockApi.markContacted(prospect.id)
    setIsMarkingContacted(false)
    alert("Marked as contacted!")
  }

  const handleHideProspect = async () => {
    await mockApi.hideProspect(prospect.id)
    onClose()
  }

  const getScoreWidth = (score: number) => `${score}%`

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white z-50 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e0e3e5] px-6 py-4 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="text-[#565e74] hover:text-[#191c1e]"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-sm text-[#565e74] hover:text-[#191c1e]">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <Button className="gap-2 bg-[#0061ff] hover:bg-[#004bca] text-white">
              <Plus className="w-4 h-4" />
              Add to Campaign
            </Button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={prospect.avatar} alt={prospect.name} />
                <AvatarFallback className="bg-[#0061ff] text-white text-xl">
                  {prospect.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#ba1a1a] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#191c1e] mb-1">{prospect.name}</h2>
              <p className="text-[#565e74] mb-3">{prospect.title} at {prospect.company}</p>
              <div className="flex items-center gap-3">
                <Button 
                  size="sm" 
                  className="gap-2 bg-[#0061ff] hover:bg-[#004bca] text-white"
                  onClick={() => window.open(prospect.linkedInUrl, "_blank")}
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Button>
                <div className="flex items-center gap-1 text-sm text-[#565e74]">
                  <MapPin className="w-4 h-4" />
                  {prospect.location}
                </div>
              </div>
            </div>
          </div>

          {/* Match Score & Matched For */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-[#e0e3e5] rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-[#565e74] font-medium mb-2">Match Score</p>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl font-bold text-[#0061ff]">{prospect.matchScore}</span>
                <span className="text-lg text-[#94a3b8]">/100</span>
              </div>
              <div className="h-2 bg-[#e0e3e5] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0061ff] rounded-full transition-all duration-500"
                  style={{ width: getScoreWidth(prospect.matchScore) }}
                />
              </div>
            </div>
            <div className="bg-white border border-[#e0e3e5] rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-[#565e74] font-medium mb-2">Matched For</p>
              <p className="text-sm text-[#191c1e] leading-relaxed">{prospect.matchedFor}</p>
            </div>
          </div>

          {/* Why Matched */}
          <div className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#6b21dc]" />
              <h3 className="font-semibold text-[#6b21dc] uppercase tracking-wider text-sm">Why Matched?</h3>
            </div>
            <p className="text-[#424656] leading-relaxed">
              {prospect.whyMatched.split("VP-level leadership").map((part, i) => (
                <span key={i}>
                  {part}
                  {i === 0 && <strong className="text-[#191c1e]">VP-level leadership</strong>}
                </span>
              )).reduce((acc, curr, i) => {
                if (i === 0) return [curr]
                return [...acc, curr]
              }, [] as JSX.Element[])}
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-white border border-[#e0e3e5] rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-[#565e74]" />
              <h3 className="font-semibold text-[#191c1e] uppercase tracking-wider text-sm">Contact Information</h3>
            </div>
            
            <div className="space-y-4">
              {/* Email */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[#94a3b8] mb-2">Business Email</p>
                <div className="flex items-center justify-between bg-[#f7f9fb] rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[#191c1e] font-mono">{prospect.contactInfo.email}</span>
                    <Badge className="bg-[#10b981]/10 text-[#10b981] border-0 text-xs">
                      {prospect.contactInfo.emailConfidence}% CONFIDENCE
                    </Badge>
                  </div>
                  <button 
                    onClick={handleCopyEmail}
                    className="text-[#565e74] hover:text-[#0061ff]"
                  >
                    {emailCopied ? (
                      <CheckCheck className="w-5 h-5 text-[#10b981]" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[#94a3b8] mb-2">Mobile Phone</p>
                <div className="flex items-center justify-between bg-[#f7f9fb] rounded-lg px-4 py-3">
                  <span className="text-[#94a3b8] italic">
                    {prospect.contactInfo.phone || "Data available for discovery"}
                  </span>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Search className="w-4 h-4" />
                    Find Phone
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button 
                onClick={handleAddToCampaign}
                disabled={isAddingToCampaign}
                className="flex-1 gap-2 bg-[#0061ff] hover:bg-[#004bca] text-white"
              >
                <Plus className="w-4 h-4" />
                {isAddingToCampaign ? "Adding..." : "Add to Campaign"}
              </Button>
              <Button 
                onClick={handleMarkContacted}
                disabled={isMarkingContacted}
                variant="outline"
                className="flex-1 gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                {isMarkingContacted ? "Marking..." : "Mark Contacted"}
              </Button>
            </div>
            <Button 
              onClick={handleHideProspect}
              variant="outline"
              className="w-full gap-2 text-[#ba1a1a] border-[#ba1a1a]/20 hover:bg-[#ba1a1a]/5"
            >
              <Ban className="w-4 h-4" />
              Not Relevant — Hide
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
