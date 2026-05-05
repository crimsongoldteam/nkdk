import { importRegisteredMetadataSourceWithGraph } from "~/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph"
import {
  resolveGraphImportSource,
  type GraphImportSourceMatch,
} from "~/metadata/orchestration/graphImport/registry"
import { GraphBuilder } from "./internal/GraphBuilder"
import type {
  FileGraphData,
  ImportContext,
  ProjectGraphInput,
  ProjectGraphSource,
} from "./types"
import { walkGraphToFileData } from "./walkGraphToFileData"

const normalizeGraphSources = (input: ProjectGraphInput): ProjectGraphSource[] => {
  if (input instanceof Map) {
    return Array.from(input.entries()).map(([filePath, text]) => ({ filePath, text }))
  }
  return [...input]
}

const applySourceStats = (
  files: FileGraphData[],
  sources: readonly ProjectGraphSource[],
): FileGraphData[] => {
  const statsByPath = new Map<string, ProjectGraphSource["fileStats"]>()
  for (const source of sources) {
    statsByPath.set(source.filePath, source.fileStats)
    if (source.pairedText) {
      statsByPath.set(source.pairedText.filePath, source.pairedText.fileStats)
    }
  }
  return files.map((file) => {
    const fileStats = statsByPath.get(file.filePath)
    return fileStats ? { ...file, fileStats } : file
  })
}

export async function buildGraph(
  projectFiles: ProjectGraphInput,
  context: ImportContext,
): Promise<FileGraphData[]> {
  const sources = normalizeGraphSources(projectFiles)
  const graph = new GraphBuilder()

  const entries = sources
    .map((source) => ({ source, parsed: parseFilePath(source.filePath) }))
    .filter((entry): entry is { source: ProjectGraphSource; parsed: ParsedGraphSourcePath } => entry.parsed !== undefined)
    .sort((a, b) => a.parsed.phase - b.parsed.phase)

  for (const { source, parsed } of entries) {
    try {
      await importRegisteredMetadataSourceWithGraph({
        filePath: source.filePath,
        sources: {
          yaml: source.text,
          paired: source.pairedText,
        },
        kind: parsed.kind,
        name: parsed.name,
        pathParams: parsed.pathParams,
        graph,
        context,
      })
    } catch {
      // Контракт buildGraph прежний: собрать то, что точно понятно.
    }
  }

  return applySourceStats(walkGraphToFileData(graph), sources)
}

export interface ParsedGraphSourcePath extends GraphImportSourceMatch {
  phase: number
}

export function parseFilePath(filePath: string): ParsedGraphSourcePath | undefined {
  const match = resolveGraphImportSource(filePath)
  if (!match) return undefined
  return {
    ...match,
    phase: match.phase ?? 0,
  }
}
