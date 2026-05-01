import { updateGraph as writeGraph } from "@nakidka/graph"
import { buildGraph } from "~/metadata/orchestration/buildGraph"
import chalk from "chalk"
import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import { performance } from "perf_hooks"

const CONTEXT = { version: "2.20", defaultLanguage: "ru" }
const OWNER_DIRS = ["Справочник", "Документ", "Перечисление"] as const

function readYamlProjectFiles(projectPath: string): Map<string, string> {
  const files = new Map<string, string>()

  const readFile = (relativePath: string): void => {
    const fullPath = join(projectPath, ...relativePath.split("/"))
    if (!existsSync(fullPath)) return
    try {
      files.set(relativePath, readFileSync(fullPath, "utf-8"))
    } catch (err) {
      console.warn(chalk.yellow(`Предупреждение: не удалось прочитать ${fullPath}: ${err}`))
    }
  }

  for (const ownerDir of OWNER_DIRS) {
    const ownerRoot = join(projectPath, ownerDir)
    if (!existsSync(ownerRoot)) continue

    for (const entry of readdirSync(ownerRoot, { withFileTypes: true }).filter((e) => e.isDirectory())) {
      readFile(`${ownerDir}/${entry.name}/Свойства.yaml`)

      const formsRoot = join(ownerRoot, entry.name, "Формы")
      if (!existsSync(formsRoot)) continue
      for (const formEntry of readdirSync(formsRoot, { withFileTypes: true }).filter((e) => e.isDirectory())) {
        readFile(`${ownerDir}/${entry.name}/Формы/${formEntry.name}/Форма.yaml`)
      }
    }
  }

  return files
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
  const graphFiles = buildGraph(yamlFiles, CONTEXT)
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
