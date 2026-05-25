import { buildGraph } from "@nakidka/core"
import type { FileGraphData, ProjectGraphSource } from "@nakidka/core"
import { updateGraph as writeGraph } from "@nakidka/graph"
import chalk from "chalk"
import { existsSync } from "fs"
import { resolve } from "path"
import { performance } from "perf_hooks"
import { readProjectFileList } from "../graph/projectFiles"
import { projectGraphName } from "../graph/projectGraphName"
import { readChangedProjectSources, readProjectGraphSources } from "../graph/projectSources"

const CONTEXT = { version: "2.20", defaultLanguage: "ru" }

export interface UpdateGraphCommandOptions {
  replace?: boolean
  bulk?: boolean
}

const createProgressReporter = () => {
  const startedAtByPhase = new Map<string, number>()
  let lastLine = ""

  return (progress: { phase: string; done?: number; total?: number }): void => {
    if (progress.done === 0) {
      startedAtByPhase.set(progress.phase, performance.now())
      return
    }

    const total = progress.total ?? 1
    const done = progress.done ?? total
    const line = `${progress.phase.padEnd(18)} ${done}/${total}`
    if (line !== lastLine) {
      console.log(line)
      lastLine = line
    }

    if (done === total) {
      const startedAt = startedAtByPhase.get(progress.phase)
      if (startedAt !== undefined) {
        console.log(`${progress.phase.padEnd(18)} done — ${(performance.now() - startedAt).toFixed(1)} мс`)
      }
    }
  }
}

const createGraphOptions = (projectPath: string) => {
  return { graphName: projectGraphName(projectPath) }
}

const createDeletionTombstones = (filePaths: readonly string[]): FileGraphData[] => {
  return filePaths.map((filePath) => ({
    filePath,
    nodes: [],
    edges: [],
  }))
}

const createSkippedSourceFiles = (
  graphFiles: readonly FileGraphData[],
  sources: readonly ProjectGraphSource[],
): FileGraphData[] => {
  const graphFilePaths = new Set(graphFiles.map((file) => file.filePath))
  const result: FileGraphData[] = []

  for (const source of sources) {
    if (!graphFilePaths.has(source.filePath)) {
      result.push({
        filePath: source.filePath,
        fileStats: source.fileStats,
        nodes: [],
        edges: [],
      })
    }

  }

  return result
}

const buildPayload = async (
  sources: readonly ProjectGraphSource[],
  deletedFilePaths: readonly string[],
): Promise<FileGraphData[]> => {
  const graphFiles = await buildGraph(sources, CONTEXT)
  return [
    ...graphFiles,
    ...createSkippedSourceFiles(graphFiles, sources),
    ...createDeletionTombstones(deletedFilePaths),
  ]
}

const attachStubEdgesToOwners = (graphFiles: readonly FileGraphData[]): FileGraphData[] => {
  const stub = graphFiles.find((file) => file.filePath === "")
  if (!stub) return [...graphFiles]

  const files = graphFiles
    .filter((file) => file.filePath !== "")
    .map((file) => ({ ...file, edges: [...file.edges] }))

  for (const edge of stub.edges) {
    const owner = files.find((file) => file.nodes.some((node) => node.id === edge.tgt))
    owner?.edges.push(edge)
  }

  return files
}

export const updateGraphFiles = async (
  projectPath: string,
  filePaths: readonly string[],
): Promise<void> => {
  const absoluteProjectPath = resolve(projectPath)
  const graphOptions = createGraphOptions(absoluteProjectPath)
  const changed = readChangedProjectSources(absoluteProjectPath, filePaths)
  const payload = attachStubEdgesToOwners(await buildPayload(changed.sources, changed.deletedFilePaths))
  if (payload.length === 0) return

  await writeGraph(payload, { ...graphOptions, onProgress: createProgressReporter() })
}

export const updateGraphFile = async (projectPath: string, filePath: string): Promise<void> => {
  await updateGraphFiles(projectPath, [filePath])
}

export const updateGraph = async (
  projectPath: string,
  opts: UpdateGraphCommandOptions = {},
): Promise<void> => {
  if (opts.bulk === true && opts.replace !== true) {
    console.error(chalk.red("--bulk можно использовать только вместе с --replace"))
    process.exit(1)
  }

  const absoluteProjectPath = resolve(projectPath)
  if (!existsSync(absoluteProjectPath)) {
    console.error(chalk.red(`Директория не найдена: ${projectPath}`))
    process.exit(1)
  }

  const tStart = performance.now()
  const tReadStart = performance.now()
  const projectFiles = readProjectFileList(absoluteProjectPath)
  const sources = readProjectGraphSources(absoluteProjectPath)
  const tRead = performance.now() - tReadStart

  const tBuildStart = performance.now()
  const graphFiles = attachStubEdgesToOwners(await buildPayload(sources, []))
  const tBuild = performance.now() - tBuildStart

  const tWriteStart = performance.now()
  const graphOptions = createGraphOptions(absoluteProjectPath)
  if (opts.replace === true) {
    await writeGraph(graphFiles, {
      ...graphOptions,
      replace: true,
      bulk: opts.bulk === true,
      onProgress: createProgressReporter(),
    })
  } else {
    await writeGraph([], graphOptions)
    await writeGraph(graphFiles, { ...graphOptions, onProgress: createProgressReporter() })
  }
  const tWrite = performance.now() - tWriteStart

  const totalNodes = graphFiles.reduce((sum, file) => sum + file.nodes.length, 0)
  const totalEdges = graphFiles.reduce((sum, file) => sum + file.edges.length, 0)
  const tTotal = performance.now() - tStart

  console.log(`чтение файлов    — ${tRead.toFixed(1)} мс — ${projectFiles.length} шт.`)
  console.log(`buildGraph       — ${tBuild.toFixed(1)} мс — узлов ${totalNodes}, рёбер ${totalEdges}`)
  console.log(`updateGraph      — ${tWrite.toFixed(1)} мс`)
  console.log(`итого            — ${tTotal.toFixed(1)} мс`)
}
