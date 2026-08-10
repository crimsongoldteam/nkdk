import { lstatSync, readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"

export interface SourceTreeFile {
  readonly absolutePath: string
  readonly relativePath: string
  readonly source: string
}

const skippedDirectories = new Set(["node_modules", ".git", ".worktrees", "dist", "coverage"])
const snapshots = new Map<string, readonly SourceTreeFile[]>()

export function readSourceTreeOnce(root: string): readonly SourceTreeFile[] {
  const absoluteRoot = resolve(root)
  const cached = snapshots.get(absoluteRoot)
  if (cached) return cached

  const files = readTypeScriptFiles(absoluteRoot, absoluteRoot)
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath))
    .map((file) => Object.freeze(file))
  const snapshot = Object.freeze(files)
  snapshots.set(absoluteRoot, snapshot)
  return snapshot
}

function readTypeScriptFiles(root: string, directory: string): SourceTreeFile[] {
  return readdirSync(directory).flatMap((entry) => {
    if (skippedDirectories.has(entry)) return []

    const absolutePath = join(directory, entry)
    const stat = lstatSync(absolutePath)
    if (stat.isSymbolicLink()) return []
    if (stat.isDirectory()) return readTypeScriptFiles(root, absolutePath)
    if (!entry.endsWith(".ts") || entry.endsWith(".d.ts")) return []

    return [
      {
        absolutePath,
        relativePath: relative(root, absolutePath),
        source: readFileSync(absolutePath, "utf8"),
      },
    ]
  })
}
