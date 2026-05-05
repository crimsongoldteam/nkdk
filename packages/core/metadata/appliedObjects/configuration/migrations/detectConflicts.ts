import { parseMigrationPath } from "./paths"
import type { MigrationConflict, StructuralState } from "./types"

export function detectMigrationConflicts(from: StructuralState, to: StructuralState): MigrationConflict[] {
  const levels = new Map<string, { from: Set<string>; to: Set<string> }>()
  for (const path of from.nodes.keys()) add(levels, path, "from")
  for (const path of to.nodes.keys()) add(levels, path, "to")

  const conflicts: MigrationConflict[] = []
  for (const [levelPath, sets] of [...levels.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const deleted = [...sets.from].filter((name) => !sets.to.has(name)).sort((a, b) => a.localeCompare(b))
    const added = [...sets.to].filter((name) => !sets.from.has(name)).sort((a, b) => a.localeCompare(b))
    if (deleted.length > 0 && added.length > 0) conflicts.push({ levelPath, deleted, added })
  }
  return conflicts
}

function add(levels: Map<string, { from: Set<string>; to: Set<string> }>, path: string, side: "from" | "to"): void {
  const parsed = parseMigrationPath(path)
  const level = levels.get(parsed.levelPath) ?? { from: new Set<string>(), to: new Set<string>() }
  level[side].add(parsed.localName)
  levels.set(parsed.levelPath, level)
}
