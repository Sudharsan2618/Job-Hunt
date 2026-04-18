"use client"

import { useRouter } from "next/navigation"
import {
  Users,
  Sparkles,
  ArrowRightLeft,
  AlertTriangle,
  Shield,
  MailOpen,
  LockOpen,
  Search,
  Target,
  ListChecks,
  Bot,
  History,
  ChevronRight,
  Download,
  Rocket,
  AtSign,
  Link,
  Send,
  GitBranch,
} from "lucide-react"

export function HomeContent() {
  const router = useRouter()

  return (
    <div className="p-8 space-y-8 overflow-y-auto">
      {/* ── Header Section ── */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="page-heading">Welcome back, Alex</h2>
          <p className="page-subtitle">
            Your AI agents have curated{" "}
            <span className="font-bold text-[#004bca]">124 new prospects</span> since yesterday.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-xl bg-[#e0e3e5] text-[#191c1e] font-semibold text-sm hover:bg-[#d8dadc] transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#004bca] to-[#0061ff] text-white font-semibold text-sm shadow-md hover:opacity-90 transition-opacity flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            Launch Agent
          </button>
        </div>
      </div>

      {/* ── Quick Stats Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-surface p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#dbe1ff] rounded-lg">
              <Users className="w-5 h-5 text-[#004bca]" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+2.4%</span>
          </div>
          <p className="stat-label">Total Leads Curated</p>
          <p className="stat-value mt-1">42,901</p>
        </div>

        <div className="card-surface p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#eaddff] rounded-lg">
              <Sparkles className="w-5 h-5 text-[#6b21dc]" />
            </div>
            <span className="text-xs font-bold text-[#004bca] bg-[#dbe1ff] px-2 py-0.5 rounded-full">Optimal</span>
          </div>
          <p className="stat-label">AI Efficiency</p>
          <p className="stat-value mt-1">98.4%</p>
        </div>

        <div className="card-surface p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#dae2fd] rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-[#565e74]" />
            </div>
            <span className="text-xs font-bold text-[#5c647a] bg-[#eceef0] px-2 py-0.5 rounded-full">Steady</span>
          </div>
          <p className="stat-label">Active Workflows</p>
          <p className="stat-value mt-1">4</p>
        </div>

        <div className="card-surface p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#ffdad6] rounded-lg">
              <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
            </div>
            <span className="text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded-full">3 Alert</span>
          </div>
          <p className="stat-label">Pending Actions</p>
          <p className="stat-value mt-1">12</p>
        </div>
      </div>

      {/* ── Main Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Human-in-the-Loop (7/12) */}
        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="section-heading flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#6b21dc]" />
              Human-in-the-Loop
            </h3>
            <button className="text-sm font-semibold text-[#004bca] hover:underline">View All Tasks</button>
          </div>
          <div className="space-y-4">
            <div className="card-surface p-4 flex items-center gap-5 border-l-4 border-[#004bca]">
              <div className="w-12 h-12 rounded-full bg-[#dbe1ff] flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-[#004bca]" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#191c1e]">Review 12 high-confidence matches</h4>
                <p className="text-sm text-[#424656]">Senior Engineering Leads in Vancouver area detected by Agent &apos;Scout-Alpha&apos;.</p>
              </div>
              <button onClick={() => router.push("/results")} className="px-4 py-2 bg-[#004bca] text-white text-xs font-bold rounded-lg hover:bg-[#0061ff] transition-colors shrink-0">Review</button>
            </div>

            <div className="card-surface p-4 flex items-center gap-5 border-l-4 border-[#6b21dc]">
              <div className="w-12 h-12 rounded-full bg-[#eaddff] flex items-center justify-center shrink-0">
                <MailOpen className="w-5 h-5 text-[#6b21dc]" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#191c1e]">Confirm 3 new prospect emails</h4>
                <p className="text-sm text-[#424656]">AI detected pattern-based emails for CleanTech Director hunt. Needs validation.</p>
              </div>
              <button className="px-4 py-2 bg-[#6b21dc] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-colors shrink-0">Validate</button>
            </div>

            <div className="card-surface p-4 flex items-center gap-5 border-l-4 border-[#ba1a1a]">
              <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center shrink-0">
                <LockOpen className="w-5 h-5 text-[#ba1a1a]" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#191c1e]">Agent &apos;Data Enricher&apos; needs login</h4>
                <p className="text-sm text-[#424656]">LinkedIn session expired. Re-authenticate to continue enrichment workflow.</p>
              </div>
              <button className="px-4 py-2 bg-[#ba1a1a] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-colors shrink-0">Resolve</button>
            </div>
          </div>
        </section>

        {/* Right: Quick Navigation (5/12) */}
        <section className="lg:col-span-5 space-y-6">
          <h3 className="section-heading flex items-center gap-2">
            <Search className="w-5 h-5 text-[#004bca]" />
            Quick Navigation
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => router.push("/search")} className="p-6 card-surface hover:shadow-md transition-all group text-left">
              <Search className="w-7 h-7 text-[#004bca] mb-3 group-hover:scale-110 transition-transform" />
              <span className="block font-bold text-sm text-[#191c1e]">Start New Search</span>
            </button>
            <button onClick={() => router.push("/search")} className="p-6 card-surface hover:shadow-md transition-all group text-left">
              <Target className="w-7 h-7 text-[#6b21dc] mb-3 group-hover:scale-110 transition-transform" />
              <span className="block font-bold text-sm text-[#191c1e]">Configure ICP</span>
            </button>
            <button onClick={() => router.push("/results")} className="p-6 card-surface hover:shadow-md transition-all group text-left">
              <ListChecks className="w-7 h-7 text-[#565e74] mb-3 group-hover:scale-110 transition-transform" />
              <span className="block font-bold text-sm text-[#191c1e]">View Active Results</span>
            </button>
            <button onClick={() => router.push("/workflows")} className="p-6 card-surface hover:shadow-md transition-all group text-left">
              <Bot className="w-7 h-7 text-[#004bca] mb-3 group-hover:scale-110 transition-transform" />
              <span className="block font-bold text-sm text-[#191c1e]">Manage Agents</span>
            </button>
            <button onClick={() => router.push("/search-history")} className="p-6 card-surface hover:shadow-md transition-all group text-left col-span-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <History className="w-7 h-7 text-slate-400" />
                <span className="font-bold text-sm text-[#191c1e]">Review Historical Campaigns</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </section>
      </div>

      {/* ── Live Pipeline Monitor ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-heading flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#004bca]" />
            Live Pipeline Monitor
          </h3>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Processing
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card-surface p-5 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h5 className="font-bold text-sm text-[#191c1e]">Vancouver Tech Search</h5>
                <p className="text-xs text-[#424656]">Job Scraping &amp; Lead Extraction</p>
              </div>
              <span className="font-mono text-sm font-bold text-[#004bca]">84%</span>
            </div>
            <div className="w-full h-2 bg-[#eceef0] rounded-full overflow-hidden">
              <div className="h-full bg-[#004bca] rounded-full transition-all duration-1000" style={{ width: "84%" }} />
            </div>
            <div className="flex justify-between mt-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Status: Deep Crawl</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ETR: 4m</span>
            </div>
          </div>
          <div className="card-surface p-5 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h5 className="font-bold text-sm text-[#191c1e]">CleanTech Director Hunt</h5>
                <p className="text-xs text-[#424656]">Email Discovery &amp; Verification</p>
              </div>
              <span className="font-mono text-sm font-bold text-[#6b21dc]">12 Found</span>
            </div>
            <div className="w-full h-2 bg-[#eceef0] rounded-full overflow-hidden flex gap-1">
              <div className="h-full bg-[#6b21dc] rounded-full" style={{ width: "15%" }} />
              <div className="h-full bg-[#6b21dc] rounded-full" style={{ width: "15%" }} />
              <div className="h-full bg-[#6b21dc] rounded-full" style={{ width: "15%" }} />
              <div className="h-full bg-slate-200 rounded-full" style={{ width: "55%" }} />
            </div>
            <div className="flex justify-between mt-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Status: Verifying Inbox</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Active Agent: Enricher-B</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent Discoveries ── */}
      <section className="space-y-4 pb-12">
        <div className="flex items-center justify-between">
          <h3 className="section-heading">Recent Discoveries</h3>
          <button className="text-sm font-semibold text-slate-500 hover:text-[#191c1e] transition-colors">Customize Columns</button>
        </div>
        <div className="card-surface rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f4f6] border-b border-[#c2c6d9]/10">
                <th className="px-6 py-4 table-header-cell">Prospect</th>
                <th className="px-6 py-4 table-header-cell">Company</th>
                <th className="px-6 py-4 table-header-cell">AI Score</th>
                <th className="px-6 py-4 table-header-cell">Channel</th>
                <th className="px-6 py-4 table-header-cell text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-[#e6e8ea] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">JS</div>
                    <div>
                      <p className="font-bold text-sm text-[#191c1e]">Jordan Smith</p>
                      <p className="text-[10px] text-slate-400">Head of Talent</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-600">Loom Inc.</td>
                <td className="px-6 py-4"><span className="font-mono text-sm bg-[#dbe1ff] text-[#004bca] px-2 py-0.5 rounded font-bold">9.8</span></td>
                <td className="px-6 py-4"><div className="flex gap-2"><AtSign className="w-4 h-4 text-slate-400" /><Link className="w-4 h-4 text-slate-400" /></div></td>
                <td className="px-6 py-4 text-right"><button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[#004bca] hover:bg-[#004bca]/5 rounded-full"><Send className="w-4 h-4" /></button></td>
              </tr>
              <tr className="hover:bg-[#e6e8ea] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">MW</div>
                    <div>
                      <p className="font-bold text-sm text-[#191c1e]">Marcus Wong</p>
                      <p className="text-[10px] text-slate-400">CTO</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-600">Veridian.ai</td>
                <td className="px-6 py-4"><span className="font-mono text-sm bg-[#eaddff] text-[#6b21dc] px-2 py-0.5 rounded font-bold">9.4</span></td>
                <td className="px-6 py-4"><div className="flex gap-2"><AtSign className="w-4 h-4 text-slate-400" /></div></td>
                <td className="px-6 py-4 text-right"><button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[#004bca] hover:bg-[#004bca]/5 rounded-full"><Send className="w-4 h-4" /></button></td>
              </tr>
              <tr className="hover:bg-[#e6e8ea] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">EL</div>
                    <div>
                      <p className="font-bold text-sm text-[#191c1e]">Elena Lopez</p>
                      <p className="text-[10px] text-slate-400">VP Engineering</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-600">Stripe</td>
                <td className="px-6 py-4"><span className="font-mono text-sm bg-[#dbe1ff] text-[#004bca] px-2 py-0.5 rounded font-bold">9.2</span></td>
                <td className="px-6 py-4"><div className="flex gap-2"><AtSign className="w-4 h-4 text-slate-400" /><Link className="w-4 h-4 text-slate-400" /></div></td>
                <td className="px-6 py-4 text-right"><button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[#004bca] hover:bg-[#004bca]/5 rounded-full"><Send className="w-4 h-4" /></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
