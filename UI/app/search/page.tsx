"use client"

import { useRouter } from "next/navigation"
import { ICPConfigContent } from "@/components/leadgen/icp-config-content"

export default function SearchPage() {
  const router = useRouter()
  return <ICPConfigContent onStartGeneration={() => router.push("/processing")} />
}
