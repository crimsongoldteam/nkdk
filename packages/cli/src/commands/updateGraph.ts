import { buildGraph, buildGraphForChangedFile } from "@nakidka/core"
import { updateGraph as writeGraph } from "@nakidka/graph"
import chalk from "chalk"
import { existsSync, readFileSync } from "fs"
import { performance } from "perf_hooks"
import { readFileStats } from "../graph/fileStats"
import { absoluteProjectFile, pairedFormPath, readProjectFileList } from "../graph/projectFiles"

const CONTEXT = { version: "2.20", defaultLanguage: "ru" }

function readYamlProjectFiles(projectPath: string): Map<string, string> {
  const files = new Map<string, string>()

  const readFile = (relativePath: string): void => {
    const fullPath = absoluteProjectFile(projectPath, relativePath)
    if (!existsSync(fullPath)) return
    try {
      files.set(relativePath, readFileSync(fullPath, "utf-8"))
    } catch (err) {
      console.warn(chalk.yellow(`Предупреждение: не удалось прочитать ${fullPath}: ${err}`))
    }
  }

  for (const filePath of readProjectFileList(projectPath)) {
    if (filePath.endsWith(".yaml")) readFile(filePath)
  }

  return files
}

export const updateGraphFile = async (projectPath: string, filePath: string): Promise<void> => {
  const fullPath = absoluteProjectFile(projectPath, filePath)
  if (!existsSync(fullPath)) {
    await writeGraph([{ filePath, nodes: [], edges: [] }])
    return
  }

  const paired = pairedFormPath(filePath)
  const pairedFullPath = paired ? absoluteProjectFile(projectPath, paired) : undefined
  const pairedText =
    paired && pairedFullPath && existsSync(pairedFullPath)
      ? { filePath: paired, text: readFileSync(pairedFullPath, "utf-8") }
      : undefined

  const graphFiles = await buildGraphForChangedFile({
    projectPath,
    filePath,
    text: readFileSync(fullPath, "utf-8"),
    pairedText,
    context: CONTEXT,
  })
  const stats = readFileStats(fullPath)
  await writeGraph(graphFiles.map((file) => ({ ...file, fileStats: stats })))
}

export const updateGraph = async (projectPath: string): Promise<void> => {
  if (!existsSync(projectPath)) {
    console.error(chalk.red(`Директория не найдена: ${projectPath}`))
    process.exit(1)
  }

  const tStart = performance.now()
  const tReadStart = performance.now()
  const yamlFiles = readYamlProjectFiles(projectPath)
  const tRead = performance.now() - tReadStart

  const tBuildStart = performance.now()
  const graphFiles = await buildGraph(yamlFiles, CONTEXT)
  const tBuild = performance.now() - tBuildStart

  const tWriteStart = performance.now()
  await writeGraph(graphFiles)
  const tWrite = performance.now() - tWriteStart

  const totalNodes = graphFiles.reduce((sum, file) => sum + file.nodes.length, 0)
  const totalEdges = graphFiles.reduce((sum, file) => sum + file.edges.length, 0)
  const tTotal = performance.now() - tStart

  console.log(`чтение YAML      — ${tRead.toFixed(1)} мс — ${yamlFiles.size} шт.`)
  console.log(`buildGraph       — ${tBuild.toFixed(1)} мс — узлов ${totalNodes}, рёбер ${totalEdges}`)
  console.log(`updateGraph      — ${tWrite.toFixed(1)} мс`)
  console.log(`итого            — ${tTotal.toFixed(1)} мс`)
}
