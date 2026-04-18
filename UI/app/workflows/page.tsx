"use client"

import { useState } from "react"
import { WorkflowsContent } from "@/components/leadgen/workflows-content"
import { WorkflowDetailContent } from "@/components/leadgen/workflow-detail-content"
import type { WorkflowAgent } from "@/lib/types"

export default function WorkflowsPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowAgent | null>(null)

  if (selectedWorkflow) {
    return (
      <WorkflowDetailContent
        workflow={selectedWorkflow}
        onBack={() => setSelectedWorkflow(null)}
      />
    )
  }

  return (
    <WorkflowsContent
      onSelectWorkflow={(workflow) => setSelectedWorkflow(workflow)}
    />
  )
}
