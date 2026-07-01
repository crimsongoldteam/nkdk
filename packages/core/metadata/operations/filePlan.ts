import fs from "fs"
import { dirname } from "path"

export type MetadataOperationFileStep =
  | { kind: "writeFile"; path: string; content: string }
  | { kind: "renamePath"; from: string; to: string }
  | { kind: "removePath"; path: string }
  | { kind: "mkdir"; path: string }

export interface MetadataOperationFilePlan {
  steps: MetadataOperationFileStep[]
}

export type MetadataOperationFilePlanResult =
  | { ok: true; changedFiles: string[] }
  | {
      ok: false
      failedStep: MetadataOperationFileStep["kind"]
      message: string
      appliedFiles: string[]
      pendingFiles: string[]
    }

export function applyMetadataOperationFilePlan(plan: MetadataOperationFilePlan): MetadataOperationFilePlanResult {
  const appliedFiles: string[] = []

  for (let index = 0; index < plan.steps.length; index += 1) {
    const step = plan.steps[index]!
    try {
      applyStep(step)
      appliedFiles.push(...filesForStep(step))
    } catch (caught) {
      return {
        ok: false,
        failedStep: step.kind,
        message: caught instanceof Error ? caught.message : String(caught),
        appliedFiles,
        pendingFiles: fromStepIndex(plan.steps, index),
      }
    }
  }

  return { ok: true, changedFiles: appliedFiles }
}

function applyStep(step: MetadataOperationFileStep): void {
  if (step.kind === "mkdir") {
    fs.mkdirSync(step.path, { recursive: true })
    return
  }
  if (step.kind === "writeFile") {
    fs.mkdirSync(dirname(step.path), { recursive: true })
    fs.writeFileSync(step.path, step.content, "utf-8")
    return
  }
  if (step.kind === "renamePath") {
    fs.mkdirSync(dirname(step.to), { recursive: true })
    fs.renameSync(step.from, step.to)
    return
  }
  fs.rmSync(step.path, { recursive: true, force: true })
}

function filesForStep(step: MetadataOperationFileStep): string[] {
  if (step.kind === "writeFile") return [step.path]
  if (step.kind === "renamePath") return [step.from, step.to]
  if (step.kind === "removePath") return [step.path]
  return []
}

function fromStepIndex(steps: readonly MetadataOperationFileStep[], index: number): string[] {
  return steps.slice(index).flatMap(filesForStep)
}
