import type { FileStats, GraphFileRecord } from "@nakidka/graph"
import { statSync } from "fs"

export function readFileStats(fullPath: string): FileStats {
  const stat = statSync(fullPath)
  return {
    mtimeMs: Math.round(stat.mtimeMs),
    size: stat.size,
    updatedAt: Date.now(),
  }
}

const normalizeMtimeMs = (mtimeMs: number): number => Math.round(mtimeMs)
const hasSameMtimeMs = (left: number, right: number): boolean =>
  Math.abs(normalizeMtimeMs(left) - normalizeMtimeMs(right)) <= 1

export function hasFileChanged(
  record: GraphFileRecord | undefined,
  stats: Pick<FileStats, "mtimeMs" | "size">,
): boolean {
  if (!record) return true
  return !hasSameMtimeMs(record.mtimeMs, stats.mtimeMs) || record.size !== stats.size
}
