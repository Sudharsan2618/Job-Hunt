"use client"

import { useParams } from "next/navigation"
import { RunResultsContent } from "@/components/leadgen/run-results-content"

export default function RunResultsPage() {
  const params = useParams()
  const id = params.id as string
  return <RunResultsContent runId={id} />
}
