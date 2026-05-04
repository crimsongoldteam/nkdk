import { buildGraphForChangedFile } from "@nakidka/core"
import { updateGraph as writeGraph } from "@nakidka/graph"
import chalk from "chalk"
import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import { performance } from "perf_hooks"
import { readFileStats } from "../graph/fileStats"
import {
  absoluteProjectFile,
  normalizeProjectFile,
  pairedFormPath,
  readProjectFileList,
} from "../graph/projectFiles"

const CONTEXT = { version: "2.20", defaultLanguage: "ru" }

export const updateGraphFile = async (projectPath: string, filePath: string): Promise<void> => {
  const absoluteProjectPath = resolve(projectPath)
  const normalizedFilePath = resolve(filePath).startsWith(absoluteProjectPath)
    ? normalizeProjectFile(absoluteProjectPath, resolve(filePath))
    : filePath
  const primaryFilePath = normalizedFilePath.endsWith("/Форма.nkdk")
    ? pairedFormPath(normalizedFilePath)
    : normalizedFilePath

  if (!primaryFilePath) {
    await writeGraph([{ filePath: normalizedFilePath, nodes: [], edges: [] }])
    return
  }

  const fullPath = absoluteProjectFile(projectPath, primaryFilePath)
  const paired = pairedFormPath(primaryFilePath)
  if (!existsSync(fullPath)) {
    await writeGraph([
      { filePath: primaryFilePath, nodes: [], edges: [] },
      ...(paired ? [{ filePath: paired, nodes: [], edges: [] }] : []),
    ])
    return
  }

  const pairedFullPath = paired ? absoluteProjectFile(projectPath, paired) : undefined
  const pairedText =
    paired && pairedFullPath && existsSync(pairedFullPath)
      ? { filePath: paired, text: readFileSync(pairedFullPath, "utf-8") }
      : undefined

  const graphFiles = await buildGraphForChangedFile({
    projectPath,
    filePath: primaryFilePath,
    text: readFileSync(fullPath, "utf-8"),
    pairedText,
    context: CONTEXT,
  })
  const filesWithStats = graphFiles.map((file) => ({
    ...file,
    fileStats: readFileStats(absoluteProjectFile(projectPath, file.filePath)),
  }))
  if (paired && !existsSync(absoluteProjectFile(projectPath, paired))) {
    await writeGraph([...filesWithStats, { filePath: paired, nodes: [], edges: [] }])
    return
  }
  await writeGraph(filesWithStats)
}

const buildProjectGraph = async (projectPath: string) => {
  const graphFiles = []

  for (const filePath of readProjectFileList(projectPath)) {
    if (!filePath.endsWith(".yaml")) continue

    const fullPath = absoluteProjectFile(projectPath, filePath)
    try {
      const paired = pairedFormPath(filePath)
      const pairedFullPath = paired ? absoluteProjectFile(projectPath, paired) : undefined
      const pairedText =
        paired && pairedFullPath && existsSync(pairedFullPath)
          ? { filePath: paired, text: readFileSync(pairedFullPath, "utf-8") }
          : undefined

      const files = await buildGraphForChangedFile({
        projectPath,
        filePath,
        text: readFileSync(fullPath, "utf-8"),
        pairedText,
        context: CONTEXT,
      })
      graphFiles.push(...files.map((file) => ({
        ...file,
        fileStats: readFileStats(absoluteProjectFile(projectPath, file.filePath)),
      })))
    } catch (err) {
      console.warn(chalk.yellow(`Предупреждение: не удалось построить граф для ${fullPath}: ${err}`))
    }
  }

  return graphFiles
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
  await writeGraph(graphFiles)
  const tWrite = performance.now() - tWriteStart

  const totalNodes = graphFiles.reduce((sum, file) => sum + file.nodes.length, 0)
  const totalEdges = graphFiles.reduce((sum, file) => sum + file.edges.length, 0)
  const tTotal = performance.now() - tStart

  console.log(`чтение файлов    — ${tRead.toFixed(1)} мс — ${projectFiles.length} шт.`)
  console.log(`buildGraph       — ${tBuild.toFixed(1)} мс — узлов ${totalNodes}, рёбер ${totalEdges}`)
  console.log(`updateGraph      — ${tWrite.toFixed(1)} мс`)
  console.log(`итого            — ${tTotal.toFixed(1)} мс`)
}
