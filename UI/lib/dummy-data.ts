import type { Industry, Region, ExecutiveTier, Lead, Prospect, TerminalLog, WorkflowAgent, WorkflowProspect, SearchHistoryItem } from "./types"

export const defaultIndustries: Industry[] = [
  { id: "1", name: "Clean Tech", selected: true },
  { id: "2", name: "Renewable Energy", selected: true },
  { id: "3", name: "Software & SaaS", selected: false },
  { id: "4", name: "Manufacturing", selected: false },
  { id: "5", name: "E-commerce", selected: false },
]

export const defaultRegions: Region[] = [
  {
    id: "1",
    name: "British Columbia",
    isPrimary: true,
    enabled: true,
    cities: [
      { id: "1-1", name: "Vancouver, BC", selected: true },
      { id: "1-2", name: "Victoria, BC", selected: true },
      { id: "1-3", name: "Surrey, BC", selected: true },
    ],
  },
]

export const defaultExecutiveTiers: ExecutiveTier[] = [
  { id: "1", name: "C-Suite (CEO, CTO)", score: 10.0 },
  { id: "2", name: "VP & Directors", score: 7.5 },
  { id: "3", name: "Managers", score: 4.0 },
]

export const sampleLeads: Lead[] = [
  {
    id: "1",
    score: 100,
    jobTitle: "Director, HR Processes & Reporting",
    leadId: "49201-B",
    company: { name: "Global Relay", initials: "GR" },
    location: "Vancouver, BC",
    industryMatch: ["Engineering", "HR"],
    postedDate: "2 days ago",
    url: "#",
  },
  {
    id: "2",
    score: 85,
    jobTitle: "Senior Director | Digital Strategy",
    leadId: "31055-C",
    company: { name: "lululemon", initials: "LL" },
    location: "Vancouver, BC",
    industryMatch: ["Clean Tech"],
    postedDate: "1 day ago",
    url: "#",
  },
  {
    id: "3",
    score: 72,
    jobTitle: "VP Engineering",
    leadId: "12944-X",
    company: { name: "Slack Technologies", initials: "ST" },
    location: "San Francisco, CA",
    industryMatch: ["SaaS"],
    postedDate: "4 hours ago",
    url: "#",
  },
]

export const sampleProspect: Prospect = {
  id: "1",
  name: "Susan Gelinas",
  title: "Chief People & Culture Officer",
  company: "lululemon",
  linkedInUrl: "https://linkedin.com/in/susangelinas",
  location: "Vancouver, BC",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
  matchScore: 85,
  matchedFor: "Senior Director | Digital Strategy, Planning and Growt...",
  whyMatched: "Strong alignment with VP-level leadership requirements in the Clean Tech/Engineering sector. Notable tenure in strategic human capital development within high-growth Vancouver-based organizations.",
  contactInfo: {
    email: "s.gelinas@lululemon.com",
    emailConfidence: 98,
    phone: undefined,
  },
}

export const terminalLogs: TerminalLog[] = [
  {
    timestamp: "14:22:01",
    type: "info",
    message: 'Scraping LinkedIn for "Engineering Manager" in Vancouver...',
    highlight: "LinkedIn",
  },
  {
    timestamp: "14:22:05",
    type: "info",
    message: "Found potential match: Senior Developer @ Mobify. Qualifying against PRD...",
  },
  {
    timestamp: "14:22:08",
    type: "success",
    message: "Lead #7721 qualified. Criteria matched: 8.4/10 confidence score.",
    highlight: "#7721",
  },
  {
    timestamp: "14:22:12",
    type: "info",
    message: 'Opening connection to Indeed API... Fetching "Technical Lead" results.',
    highlight: "Indeed API",
  },
  {
    timestamp: "14:22:15",
    type: "ai_agent",
    message: "Processing natural language extraction on job description (ID: 9928)... Building context nodes.",
  },
  {
    timestamp: "14:22:18",
    type: "info",
    message: "Scanning CEO profiles in Vancouver region... Identifying decision maker nodes.",
  },
]

// Workflow Agents
export const workflowAgents: WorkflowAgent[] = [
  {
    id: "email",
    name: "Email Workflow",
    description: "Automated email sequences for prospect outreach",
    icon: "mail",
    color: "#0061ff",
    prospectsCount: 156,
    activeCount: 42,
    completedCount: 89,
  },
  {
    id: "call",
    name: "Call Workflow",
    description: "Phone outreach scheduling and tracking",
    icon: "phone",
    color: "#10b981",
    prospectsCount: 78,
    activeCount: 15,
    completedCount: 52,
  },
  {
    id: "campaign",
    name: "Campaign Outreach",
    description: "Multi-channel campaign automation",
    icon: "megaphone",
    color: "#6b21dc",
    prospectsCount: 234,
    activeCount: 67,
    completedCount: 145,
  },
  {
    id: "linkedin",
    name: "LinkedIn Agent",
    description: "LinkedIn connection and messaging automation",
    icon: "linkedin",
    color: "#0077b5",
    prospectsCount: 189,
    activeCount: 54,
    completedCount: 112,
  },
  {
    id: "calendar",
    name: "Meeting Scheduler",
    description: "Automated meeting scheduling with prospects",
    icon: "calendar",
    color: "#f59e0b",
    prospectsCount: 67,
    activeCount: 23,
    completedCount: 34,
  },
  {
    id: "custom",
    name: "Custom AI Agent",
    description: "Build your own AI-powered workflow",
    icon: "bot",
    color: "#ec4899",
    prospectsCount: 45,
    activeCount: 12,
    completedCount: 28,
  },
]

// Workflow Prospects with history
export const workflowProspects: WorkflowProspect[] = [
  {
    id: "wp-1",
    prospectId: "1",
    name: "Susan Gelinas",
    title: "Chief People & Culture Officer",
    company: "lululemon",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    status: "in_progress",
    addedAt: "2024-03-15",
    lastActivity: "2 hours ago",
    history: [
      { id: "h1", timestamp: "2024-03-15 09:00", action: "Added to Email Workflow", status: "success" },
      { id: "h2", timestamp: "2024-03-15 09:05", action: "Initial email sent", status: "success" },
      { id: "h3", timestamp: "2024-03-16 14:30", action: "Follow-up email sent", status: "success" },
      { id: "h4", timestamp: "2024-03-18 10:15", action: "Email opened (3 times)", status: "success" },
      { id: "h5", timestamp: "2024-03-20 11:00", action: "Awaiting response", status: "pending" },
    ],
  },
  {
    id: "wp-2",
    prospectId: "2",
    name: "Michael Chen",
    title: "VP Engineering",
    company: "Slack Technologies",
    status: "completed",
    addedAt: "2024-03-10",
    lastActivity: "1 day ago",
    history: [
      { id: "h1", timestamp: "2024-03-10 08:00", action: "Added to Email Workflow", status: "success" },
      { id: "h2", timestamp: "2024-03-10 08:05", action: "Initial email sent", status: "success" },
      { id: "h3", timestamp: "2024-03-11 15:20", action: "Email opened", status: "success" },
      { id: "h4", timestamp: "2024-03-12 09:45", action: "Reply received - Meeting requested", status: "success" },
      { id: "h5", timestamp: "2024-03-14 14:00", action: "Meeting scheduled for March 20", status: "success" },
    ],
  },
  {
    id: "wp-3",
    prospectId: "3",
    name: "Jennifer Walsh",
    title: "Director of Operations",
    company: "Global Relay",
    status: "pending",
    addedAt: "2024-03-18",
    lastActivity: "3 hours ago",
    history: [
      { id: "h1", timestamp: "2024-03-18 11:00", action: "Added to Email Workflow", status: "success" },
      { id: "h2", timestamp: "2024-03-18 11:05", action: "Email scheduled for send", status: "pending" },
    ],
  },
  {
    id: "wp-4",
    prospectId: "4",
    name: "David Park",
    title: "CTO",
    company: "Hootsuite",
    status: "failed",
    addedAt: "2024-03-08",
    lastActivity: "5 days ago",
    history: [
      { id: "h1", timestamp: "2024-03-08 10:00", action: "Added to Email Workflow", status: "success" },
      { id: "h2", timestamp: "2024-03-08 10:05", action: "Initial email sent", status: "success" },
      { id: "h3", timestamp: "2024-03-10 09:00", action: "Follow-up email sent", status: "success" },
      { id: "h4", timestamp: "2024-03-12 16:00", action: "Email bounced - invalid address", status: "failed" },
    ],
  },
  {
    id: "wp-5",
    prospectId: "5",
    name: "Emily Rodriguez",
    title: "Head of HR",
    company: "Clio",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    status: "in_progress",
    addedAt: "2024-03-14",
    lastActivity: "6 hours ago",
    history: [
      { id: "h1", timestamp: "2024-03-14 13:00", action: "Added to Email Workflow", status: "success" },
      { id: "h2", timestamp: "2024-03-14 13:05", action: "Initial email sent", status: "success" },
      { id: "h3", timestamp: "2024-03-15 10:30", action: "Email opened (2 times)", status: "success" },
      { id: "h4", timestamp: "2024-03-17 14:00", action: "Follow-up email sent", status: "success" },
      { id: "h5", timestamp: "2024-03-18 09:00", action: "Link clicked - viewed pricing page", status: "success" },
    ],
  },
]

// Search History
export const searchHistory: SearchHistoryItem[] = [
  {
    id: "sh-1",
    name: "Vancouver Tech Talent Pipeline",
    createdAt: "2024-03-20",
    industries: ["Clean Tech", "Renewable Energy", "Software & SaaS"],
    regions: ["Vancouver, BC", "Victoria, BC"],
    executiveTitles: ["CEO", "CTO", "VP Engineering"],
    resultsCount: 1248,
    status: "completed",
  },
  {
    id: "sh-2",
    name: "Q3 Growth - Engineering Roles",
    createdAt: "2024-03-15",
    industries: ["Engineering", "Manufacturing"],
    regions: ["San Francisco, CA", "Seattle, WA"],
    executiveTitles: ["VP Engineering", "Director of Engineering", "Engineering Manager"],
    resultsCount: 892,
    status: "completed",
  },
  {
    id: "sh-3",
    name: "Healthcare Executive Search",
    createdAt: "2024-03-12",
    industries: ["Healthcare", "Biotech"],
    regions: ["Boston, MA", "New York, NY"],
    executiveTitles: ["CEO", "CFO", "Chief Medical Officer"],
    resultsCount: 456,
    status: "completed",
  },
  {
    id: "sh-4",
    name: "FinTech Leaders West Coast",
    createdAt: "2024-03-08",
    industries: ["FinTech", "Banking", "Insurance"],
    regions: ["Los Angeles, CA", "San Diego, CA"],
    executiveTitles: ["CEO", "CTO", "VP Product"],
    resultsCount: 678,
    status: "completed",
  },
  {
    id: "sh-5",
    name: "E-commerce Expansion Search",
    createdAt: "2024-03-05",
    industries: ["E-commerce", "Retail", "Logistics"],
    regions: ["Toronto, ON", "Montreal, QC"],
    executiveTitles: ["VP Operations", "Director of Logistics", "Head of Supply Chain"],
    resultsCount: 534,
    status: "completed",
  },
  {
    id: "sh-6",
    name: "AI/ML Talent Acquisition",
    createdAt: "2024-03-01",
    industries: ["AI/ML", "Data Science", "Software"],
    regions: ["Vancouver, BC", "Seattle, WA", "San Francisco, CA"],
    executiveTitles: ["Chief Data Officer", "VP AI/ML", "Head of Data Science"],
    resultsCount: 0,
    status: "in_progress",
  },
  {
    id: "sh-7",
    name: "Draft - Green Energy Executives",
    createdAt: "2024-02-28",
    industries: ["Solar", "Wind Energy"],
    regions: ["Denver, CO"],
    executiveTitles: ["CEO", "COO"],
    resultsCount: 0,
    status: "draft",
  },
]

// API mock functions
export const mockApi = {
  startLeadGeneration: async (config: unknown): Promise<{ success: boolean; jobId: string }> => {
    console.log("Starting lead generation with config:", config)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, jobId: "job-" + Date.now() })
      }, 1000)
    })
  },

  getProcessingStatus: async (): Promise<{
    step: number
    progress: number
    stats: { jobsScraped: number; leadsQualified: number; aiQueries: number; prospectsFound: number }
  }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          step: 2,
          progress: 38.4,
          stats: {
            jobsScraped: 1248,
            leadsQualified: 412,
            aiQueries: 0,
            prospectsFound: 0,
          },
        })
      }, 500)
    })
  },

  getLeads: async (): Promise<Lead[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate more leads for the table
        const allLeads: Lead[] = []
        for (let i = 0; i < 4; i++) {
          sampleLeads.forEach((lead) => {
            allLeads.push({
              ...lead,
              id: lead.id + "-" + i,
            })
          })
        }
        resolve(allLeads)
      }, 500)
    })
  },

  getProspect: async (id: string): Promise<Prospect> => {
    console.log("Fetching prospect:", id)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(sampleProspect)
      }, 300)
    })
  },

  addToCampaign: async (prospectId: string): Promise<{ success: boolean }> => {
    console.log("Adding to campaign:", prospectId)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true })
      }, 500)
    })
  },

  markContacted: async (prospectId: string): Promise<{ success: boolean }> => {
    console.log("Marking contacted:", prospectId)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true })
      }, 500)
    })
  },

  hideProspect: async (prospectId: string): Promise<{ success: boolean }> => {
    console.log("Hiding prospect:", prospectId)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true })
      }, 500)
    })
  },

  exportCSV: async (): Promise<Blob> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const csv = "Score,Job Title,Company,Location,Industry Match\n100,Director HR,Global Relay,Vancouver BC,Engineering"
        resolve(new Blob([csv], { type: "text/csv" }))
      }, 500)
    })
  },

  syncCRM: async (): Promise<{ success: boolean; syncedCount: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, syncedCount: 50 })
      }, 1000)
    })
  },
}
