"use client"

import { useParams } from "next/navigation"
import { RunDetailContent } from "@/components/leadgen/run-detail-content"

export default function RunDetailPage() {
  const params = useParams()
  const id = params.id as string
  return <RunDetailContent runId={id} />
}
