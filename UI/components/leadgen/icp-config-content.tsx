"use client"

import { useState, useEffect } from "react"
import { 
  X, 
  Plus,
  Play,
  MapPin,
  Factory,
  BadgeCheck,
  BarChart2,
  Ban,
  Brain,
  Check,
  ArrowRight,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ICPConfigContentProps {
  onStartGeneration: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface TitleConfig {
  title: string
  isActive: boolean
  isDefault: boolean
}

interface LocationConfig {
  location: string
  country: string
  isActive: boolean
  isDefault: boolean
}

interface IndustryConfig {
  slug: string
  displayName: string
  isTarget: boolean
  linkedinNames: string[]
}

interface ICPConfig {
  version: number
  isActive: boolean
  titles: TitleConfig[]
  locations: LocationConfig[]
  industries: IndustryConfig[]
  personaMappings: any[]
  defaultPersonaTitles: string[]
}

export function ICPConfigContent({ onStartGeneration }: ICPConfigContentProps) {
  const [icpConfig, setIcpConfig] = useState<ICPConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [startingRun, setStartingRun] = useState(false)
  
  // UI state - mapped from ICP config
  const [industries, setIndustries] = useState<{id: string, name: string, selected: boolean}[]>([])
  const [titles, setTitles] = useState<{id: string, name: string, selected: boolean}[]>([])
  const [cityList, setCityList] = useState<{id: string, name: string, selected: boolean}[]>([])
  const [keywords, setKeywords] = useState<string[]>(["contract", "temporary", "internship", "co-op", "recruiting"])
  const [filterStaffing, setFilterStaffing] = useState(true)
  const [scoreThreshold, setScoreThreshold] = useState([60])
  const [resultsPerBatch, setResultsPerBatch] = useState("50")
  const [maxPostingAge, setMaxPostingAge] = useState("24")
  const [activeSources, setActiveSources] = useState<string[]>(["linkedin", "naukri"])
  const [customTitle, setCustomTitle] = useState("")
  const [titleSearch, setTitleSearch] = useState("")
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)

  // Naukri Settings
  const [minExperience, setMinExperience] = useState<number | undefined>(undefined)
  const [maxExperience, setMaxExperience] = useState<number | undefined>(undefined)
  const [scrapeDescriptions, setScrapeDescriptions] = useState(true)
  const [maxDescriptions, setMaxDescriptions] = useState(10)
  const [searchUrl, setSearchUrl] = useState("https://www.naukri.com/python-developer-jobs-in-chennai?k=python%20developer&l=chennai&jobAge=1&experience=3")

  // Fetch ICP config from backend
  useEffect(() => {
    const fetchICPConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/icp/config`)
        if (response.ok) {
          const data: ICPConfig = await response.json()
          setIcpConfig(data)
          
          // Map ICP config to UI state
          setIndustries(data.industries.map((ind, idx) => ({
            id: ind.slug,
            name: ind.displayName,
            selected: ind.isTarget
          })))
          
          setTitles(data.titles.map((title, idx) => ({
            id: idx.toString(),
            name: title.title,
            selected: title.isDefault
          })))
          
          setCityList(data.locations.map((loc, idx) => ({
            id: idx.toString(),
            name: loc.location,
            selected: loc.isDefault
          })))
        }
      } catch (error) {
        console.error("Failed to fetch ICP config:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchICPConfig()
  }, [])

  const toggleIndustry = (id: string) => {
    setIndustries(industries.map(ind => 
      ind.id === id ? { ...ind, selected: !ind.selected } : ind
    ))
  }

  const toggleTitle = (id: string) => {
    setTitles(titles.map(t => 
      t.id === id ? { ...t, selected: !t.selected } : t
    ))
  }

  const toggleCity = (id: string) => {
    setCityList(cityList.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ))
  }

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword))
  }

  const selectAllTitles = () => {
    setTitles(titles.map(t => ({ ...t, selected: true })))
  }

  const unselectAllTitles = () => {
    setTitles(titles.map(t => ({ ...t, selected: false })))
  }

  const selectedTitleCount = titles.filter((t) => t.selected).length
  const filteredTitles = titles.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(titleSearch.toLowerCase())
    const matchesSelection = showSelectedOnly ? t.selected : true
    return matchesSearch && matchesSelection
  })

  const toggleSource = (source: string) => {
    setActiveSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    )
  }

  const handleStartGeneration = async () => {
    setStartingRun(true)
    try {
      const selectedTitles = titles.filter(t => t.selected).map(t => t.name)
      const selectedLocations = cityList.filter(c => c.selected).map(c => c.name)

      if (activeSources.length === 0) {
        alert("Please select at least one active source")
        setStartingRun(false)
        return
      }

      const hasJobSpy = activeSources.some(s => s === "linkedin")
      const hasNaukri = activeSources.includes("naukri")
      
      let runSource = "jobspy"
      if (hasJobSpy && hasNaukri) {
        runSource = "mixed"
      } else if (hasNaukri) {
        runSource = "naukri"
      }
      
      const runConfigPayload: any = {
        searchTitles: selectedTitles,
        searchLocations: selectedLocations,
        hoursOld: parseInt(maxPostingAge) || 24,
        resultsPerSearch: parseInt(resultsPerBatch) || 50,
        siteName: activeSources,
        icpConfigSnapshot: icpConfig ? {
          version: icpConfig.version
        } : null
      }

      if (hasNaukri) {
        runConfigPayload.searchUrl = searchUrl || undefined
        runConfigPayload.scrapeDescriptions = scrapeDescriptions
        runConfigPayload.maxDescriptions = maxDescriptions
        runConfigPayload.minExperience = minExperience
        runConfigPayload.maxExperience = maxExperience
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/runs/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Run (${activeSources.map(s => s === "linkedin" ? "LinkedIn" : "Naukri").join("+")}) - ${new Date().toLocaleDateString()}`,
          source: runSource,
          runConfig: runConfigPayload
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Run started:", result)
        onStartGeneration()
      } else {
        const errorText = await response.text()
        console.error("Failed to start run:", errorText)
        alert(`Failed to start run: ${errorText}`)
      }
    } catch (error) {
      console.error("Error starting run:", error)
      alert("Error starting run. Please check backend connection.")
    } finally {
      setStartingRun(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Loading ICP configuration...</span>
      </div>
    )
  }

  return (
    <div className="p-8 pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Target Customer Profile</h2>
          <p className="text-slate-500 max-w-2xl">
            Define your Ideal Customer Profile parameters. Our AI agents will use these criteria to curate and score high-intent leads across global job boards and professional networks.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Target Industries */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-transparent">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Factory className="w-5 h-5 text-blue-600" />
                  Target Industries
                </h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Multi-Select</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {industries.map(industry => (
                  <button
                    key={industry.id}
                    onClick={() => toggleIndustry(industry.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                      industry.selected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {industry.name}
                    {industry.selected && <X className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </section>

            {/* Executive Search Titles */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-transparent">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-blue-600" />
                    Executive Search Titles
                  </h3>
                  <div className="text-xs text-slate-500 font-medium">
                    {selectedTitleCount} / {titles.length} selected
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={titleSearch}
                    onChange={(e) => setTitleSearch(e.target.value)}
                    placeholder="Search titles..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSelectedOnly((prev) => !prev)}
                      className="text-xs"
                    >
                      {showSelectedOnly ? "Show All" : "Selected Only"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllTitles}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={unselectAllTitles}
                      className="text-xs"
                    >
                      Unselect All
                    </Button>
                  </div>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTitles.map(title => (
                    <label
                      key={title.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        title.selected ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      <Checkbox
                        checked={title.selected}
                        onCheckedChange={() => toggleTitle(title.id)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <span className={`text-sm font-medium ${title.selected ? 'text-slate-800' : 'text-slate-500'}`}>
                        {title.name}
                      </span>
                    </label>
                  ))}
                </div>

                {filteredTitles.length === 0 && (
                  <div className="text-sm text-slate-500 py-8 text-center bg-slate-50 rounded-lg mt-2">
                    No titles found for your current filter.
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Add custom title..."
                    className="flex-1 bg-slate-100 border-none rounded-lg py-2 px-4 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <button className="p-2 bg-slate-900 text-white rounded-lg hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

           

            {/* Scraper Mode & Platforms */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-transparent">
              <div className="flex items-center gap-2 mb-6">
                <Play className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Scraper Mode & Platforms</h3>
              </div>

              {/* Scraper Mode Tabs/Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  { id: "linkedin", label: "LinkedIn", desc: "Search professional networks via JobSpy. Ideal for US/EU." },
                  { id: "naukri", label: "Naukri.com", desc: "Scrape Naukri India listings & descriptions via Firecrawl." }
                ].map((source) => {
                  const isSelected = activeSources.includes(source.id)
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => toggleSource(source.id)}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="font-bold text-slate-900 text-sm">{source.label}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">{source.desc}</div>
                    </button>
                  )
                })}
              </div>

              {activeSources.includes("naukri") && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Naukri.com Settings</h4>
                  {/* Naukri Config Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 block font-bold">
                        Min Experience (Years)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 2"
                        value={minExperience !== undefined ? minExperience : ""}
                        onChange={(e) => setMinExperience(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 block font-bold">
                        Max Experience (Years)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={maxExperience !== undefined ? maxExperience : ""}
                        onChange={(e) => setMaxExperience(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">Scrape Full Descriptions</span>
                        <span className="text-[10px] text-slate-500">Necessary for accurate lead grading</span>
                      </div>
                      <Switch
                        checked={scrapeDescriptions}
                        onCheckedChange={setScrapeDescriptions}
                      />
                    </div>
                    {scrapeDescriptions && (
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 block font-bold">
                          Max Descriptions to Scrape
                        </label>
                        <input
                          type="number"
                          value={maxDescriptions}
                          onChange={(e) => setMaxDescriptions(parseInt(e.target.value) || 10)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 block font-bold">
                      Direct Naukri Search URL (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="https://www.naukri.com/..."
                      value={searchUrl}
                      onChange={(e) => setSearchUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      If left blank, slug-based URLs will be automatically generated.
                    </p>
                    <p className="text-[10px] text-[#004bca] font-mono mt-1 break-all bg-[#004bca]/5 p-2 rounded border border-[#004bca]/10">
                      Default URL: https://www.naukri.com/python-developer-jobs-in-chennai?k=python%20developer&l=chennai&jobAge=1&experience=3
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Pipeline Configuration */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-transparent">
              <div className="flex items-center gap-2 mb-6">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Pipeline Configuration</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block">
                    Results per Batch
                  </label>
                  <input 
                    type={activeSources.includes("linkedin") ? "number" : "text"}
                    disabled={!activeSources.includes("linkedin")}
                    value={activeSources.includes("linkedin") ? resultsPerBatch : "All Pages"}
                    onChange={(e) => setResultsPerBatch(e.target.value)}
                    className={`w-full border rounded-lg py-3 px-4 text-lg font-semibold ${
                      activeSources.includes("linkedin")
                        ? "bg-slate-50 border-slate-200 text-slate-900"
                        : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {activeSources.includes("linkedin")
                      ? "Limit of scraped jobs per search query (LinkedIn)."
                      : "Naukri ignores batch limits and scrapes all pages automatically."}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block">
                    Max Posting Age (Hrs)
                  </label>
                  <input 
                    type="number"
                    value={maxPostingAge}
                    onChange={(e) => setMaxPostingAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-lg font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block">
                    Job Type
                  </label>
                  <Select defaultValue="full-time">
                    <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-Time Only</SelectItem>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* Geography */}
            <section className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                Geography
              </h3>
              <div className="relative w-full h-32 bg-slate-100 rounded-lg mb-4 overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1619468129361-605ebea04b44?w=400&h=200&fit=crop" 
                  alt="British Columbia map"
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold shadow-sm">
                    BRITISH COLUMBIA, CA
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {cityList.map(city => (
                  <label 
                    key={city.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className={`text-sm font-medium ${city.selected ? 'text-slate-900' : 'text-slate-400'}`}>
                      {city.name}
                    </span>
                    <Checkbox 
                      checked={city.selected}
                      onCheckedChange={() => toggleCity(city.id)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </label>
                ))}
              </div>
            </section>

            {/* Negative Keywords */}
            <section className="bg-slate-100 p-6 rounded-xl">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Ban className="w-5 h-5 text-red-500" />
                Negative Keywords
              </h3>
              <p className="text-[10px] text-slate-500 mb-4">Exclude profiles containing these terms</p>
              <div className="flex flex-wrap gap-2">
                {keywords.map(keyword => (
                  <span 
                    key={keyword}
                    className="bg-white border border-slate-200 px-3 py-1 rounded-md text-xs font-mono text-slate-600 flex items-center gap-2"
                  >
                    {keyword}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeKeyword(keyword)}
                    />
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch 
                    checked={filterStaffing}
                    onCheckedChange={setFilterStaffing}
                  />
                  <span className="text-xs font-medium text-slate-700">Filter Staffing Firms</span>
                </label>
              </div>
            </section>

            {/* AI Agent Tuning */}
            <section className="bg-violet-50 p-6 rounded-xl border border-violet-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-violet-600" />
                AI Agent Tuning
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700">Score Threshold</span>
                    <span className="font-mono text-xs font-black bg-white px-2 py-0.5 rounded shadow-sm">
                      {scoreThreshold[0]}%
                    </span>
                  </div>
                  <Slider
                    value={scoreThreshold}
                    onValueChange={setScoreThreshold}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] mt-1 text-slate-500">
                    <span>Loose</span>
                    <span>Precise</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase mb-2 block tracking-widest">
                    Processing Model
                  </label>
                  <Select defaultValue="gemini-pro">
                    <SelectTrigger className="w-full bg-white border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-pro">Gemini 1.5 Pro (Optimized)</SelectItem>
                      <SelectItem value="gpt-4">GPT-4 Turbo</SelectItem>
                      <SelectItem value="claude">Claude 3 Opus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-56 right-0 bg-white border-t border-slate-200 py-4 px-8 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" />
                <AvatarFallback>A1</AvatarFallback>
              </Avatar>
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face" />
                <AvatarFallback>A2</AvatarFallback>
              </Avatar>
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarImage src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=32&h=32&fit=crop&crop=face" />
                <AvatarFallback>A3</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-sm text-slate-500">3 Agents ready to deploy with current parameters.</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-slate-600">
              Save as Template
            </Button>
            <Button 
              onClick={handleStartGeneration}
              disabled={startingRun}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6"
            >
              {startingRun ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  Start Lead Generation
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
