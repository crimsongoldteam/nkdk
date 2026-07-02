import { resolve } from "path"
import type { ValidationProjectFile } from "./projectFiles"
import type { EnqueueDependencyResult, ValidationMode, ValidationQueueEntry } from "./projectValidationTypes"

export interface ValidationYamlQueue {
  readonly mode: ValidationMode
  takePending(limit: number): ValidationProjectFile[]
  markRunning(filePath: string): void
  markReady(filePath: string): void
  markError(filePath: string): void
  enqueueDependency(file: ValidationProjectFile): EnqueueDependencyResult
  entries(): ValidationQueueEntry[]
  hasPending(): boolean
}

export function createValidationYamlQueue(params: {
  mode: ValidationMode
  initialFiles: readonly ValidationProjectFile[]
}): ValidationYamlQueue {
  const entries = new Map<string, ValidationQueueEntry>()
  for (const file of params.initialFiles) {
    const key = normalizePath(file.absolutePath)
    if (!entries.has(key)) entries.set(key, { file, status: "pending" })
  }

  return {
    mode: params.mode,
    takePending(limit) {
      return [...entries.values()]
        .filter((entry) => entry.status === "pending")
        .slice(0, limit)
        .map((entry) => entry.file)
    },
    markRunning(filePath) {
      setStatus(entries, filePath, "running")
    },
    markReady(filePath) {
      setStatus(entries, filePath, "ready")
    },
    markError(filePath) {
      setStatus(entries, filePath, "error")
    },
    enqueueDependency(file) {
      const key = normalizePath(file.absolutePath)
      if (entries.has(key)) return "already-known"
      entries.set(key, { file, status: "pending" })
      return "enqueued"
    },
    entries() {
      return [...entries.values()]
    },
    hasPending() {
      return [...entries.values()].some((entry) => entry.status === "pending")
    },
  }
}

function setStatus(
  entries: Map<string, ValidationQueueEntry>,
  filePath: string,
  status: ValidationQueueEntry["status"]
): void {
  const entry = entries.get(normalizePath(filePath))
  if (entry) entry.status = status
}

function normalizePath(filePath: string): string {
  return resolve(filePath)
}
