import type { PlatformRuntime } from "../runtime"
import { nodePlatformRuntime } from "../runtime"
import { parseV8i } from "./parseV8i"
import { discoverInfobaseSources } from "./sources"
import { buildInfobaseTree } from "./tree"
import type {
  InfobaseConnection,
  InfobaseFolderNode,
  InfobaseNode,
  InfobaseSource,
  InfobaseTreeNode,
  InfobaseWarning,
  InfobaseWarningCode,
  ParsedRecord,
} from "./types"

export type {
  InfobaseConnection,
  InfobaseFolderNode,
  InfobaseNode,
  InfobaseSource,
  InfobaseTreeNode,
  InfobaseWarning,
  InfobaseWarningCode,
}

export type InfobaseTreeResult = {
  tree: InfobaseTreeNode[]
  sources: InfobaseSource[]
  warnings: InfobaseWarning[]
}

function warningFromError(source: string, caught: unknown): InfobaseWarning {
  const code = (caught as { code?: string }).code === "ENOENT" ? "source-not-found" : "source-unreadable"
  return {
    code,
    source,
    message: caught instanceof Error ? caught.message : String(caught),
  }
}

export async function listInfobasesWithRuntime(runtime: PlatformRuntime): Promise<InfobaseTreeResult> {
  const discovery = await discoverInfobaseSources(runtime)
  const sources: InfobaseSource[] = []
  const recordsBySource: ParsedRecord[][] = []
  const warnings = [...discovery.warnings]
  const canonicalPaths = new Set<string>()

  for (const candidate of discovery.candidates) {
    let canonicalPath: string
    try {
      canonicalPath = await runtime.fs.realpath(candidate.path)
    } catch (caught) {
      warnings.push(warningFromError(candidate.path, caught))
      continue
    }
    const canonicalKey =
      runtime.environment.os === "win32" ? canonicalPath.toLowerCase() : canonicalPath
    if (canonicalPaths.has(canonicalKey)) continue
    canonicalPaths.add(canonicalKey)

    let text: string
    try {
      text = await runtime.fs.readFile(candidate.path)
    } catch (caught) {
      warnings.push(warningFromError(candidate.path, caught))
      continue
    }

    const sourceOrder = sources.length
    const parsed = parseV8i(text, candidate.path, sourceOrder)
    sources.push(candidate)
    recordsBySource.push(parsed.records)
    warnings.push(...parsed.warnings)
  }

  const built = buildInfobaseTree(recordsBySource, { os: runtime.environment.os })
  return {
    tree: built.tree,
    sources,
    warnings: [...warnings, ...built.warnings],
  }
}

export async function listInfobases(): Promise<InfobaseTreeResult> {
  return listInfobasesWithRuntime(nodePlatformRuntime)
}
