"use client"

import { useRouter } from "next/navigation"
import { ProcessingContent } from "@/components/leadgen/processing-content"

export default function ProcessingPage() {
  const router = useRouter()
  return <ProcessingContent onComplete={() => router.push("/results")} />
}
