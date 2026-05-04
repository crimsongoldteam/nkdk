import type { FileStats, GraphFileRecord } from "@nakidka/graph"
import { statSync } from "fs"

export function readFileStats(fullPath: string): FileStats {
  const stat = statSync(fullPath)
  return {
    mtimeMs: stat.mtimeMs,
    size: stat.size,
    updatedAt: Date.now(),
  }
}

export function hasFileChanged(
  record: GraphFileRecord | undefined,
  stats: Pick<FileStats, "mtimeMs" | "size">,
): boolean {
  if (!record) return true
  return record.mtimeMs !== stats.mtimeMs || record.size !== stats.size
}
