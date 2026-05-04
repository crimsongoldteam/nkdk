import { buildGraph, buildGraphForChangedFile } from "@nakidka/core"
import type { FileGraphData } from "@nakidka/core"
import { updateGraph as writeGraph } from "@nakidka/graph"
import chalk from "chalk"
import { existsSync } from "fs"
import { resolve } from "path"
import { performance } from "perf_hooks"
import { readProjectFileList } from "../graph/projectFiles"
import { readChangedProjectSource, readProjectGraphSources } from "../graph/projectSources"

const CONTEXT = { version: "2.20", defaultLanguage: "ru" }

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

const applyChangedSourceStats = (
  graphFiles: FileGraphData[],
  changed: NonNullable<ReturnType<typeof readChangedProjectSource>["source"]>,
): FileGraphData[] => {
  const statsByPath = new Map([
    [changed.filePath, changed.fileStats],
    ...(changed.pairedText ? [[changed.pairedText.filePath, changed.pairedText.fileStats] as const] : []),
  ])

  return graphFiles.map((file) => {
    const fileStats = statsByPath.get(file.filePath)
    return fileStats ? { ...file, fileStats } : file
  })
}

export const updateGraphFile = async (projectPath: string, filePath: string): Promise<void> => {
  const absoluteProjectPath = resolve(projectPath)
  const changed = readChangedProjectSource(absoluteProjectPath, filePath)
  let payload: FileGraphData[]

  if (changed.deleted) {
    payload = changed.deletedFilePaths.map((deletedFilePath) => ({
      filePath: deletedFilePath,
      nodes: [],
      edges: [],
    }))
  } else {
    if (!changed.source) return

    const graphFiles = await buildGraphForChangedFile({
      projectPath: absoluteProjectPath,
      filePath: changed.source.filePath,
      text: changed.source.text,
      pairedText: changed.source.pairedText,
      context: CONTEXT,
    })
    const filesWithStats = applyChangedSourceStats(graphFiles, changed.source)
    const deletedFiles = changed.deletedFilePaths.map((deletedFilePath) => ({
      filePath: deletedFilePath,
      nodes: [],
      edges: [],
    }))
    payload = [...filesWithStats, ...deletedFiles]
  }
  await writeGraph(payload, { onProgress: createProgressReporter() })
}

const buildProjectGraph = async (projectPath: string) => {
  return buildGraph(readProjectGraphSources(projectPath, { includePairedText: false }), CONTEXT)
}

export const updateGraph = async (projectPath: string): Promise<void> => {
  if (!existsSync(projectPath)) {
    console.error(chalk.red(`Директория не найдена: ${projectPath}`))
    process.exit(1)
  }

  const tStart = performance.now()
  const tReadStart = performance.now()
  const projectFiles = readProjectFileList(projectPath)
  const tRead = performance.now() - tReadStart

  const tBuildStart = performance.now()
  const graphFiles = await buildProjectGraph(projectPath)
  const tBuild = performance.now() - tBuildStart

  const tWriteStart = performance.now()
  await writeGraph(graphFiles, { onProgress: createProgressReporter() })
  const tWrite = performance.now() - tWriteStart

  const totalNodes = graphFiles.reduce((sum, file) => sum + file.nodes.length, 0)
  const totalEdges = graphFiles.reduce((sum, file) => sum + file.edges.length, 0)
  const tTotal = performance.now() - tStart

  console.log(`чтение файлов    — ${tRead.toFixed(1)} мс — ${projectFiles.length} шт.`)
  console.log(`buildGraph       — ${tBuild.toFixed(1)} мс — узлов ${totalNodes}, рёбер ${totalEdges}`)
  console.log(`updateGraph      — ${tWrite.toFixed(1)} мс`)
  console.log(`итого            — ${tTotal.toFixed(1)} мс`)
}
