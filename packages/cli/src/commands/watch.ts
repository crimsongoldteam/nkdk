import { getGraphFiles } from "@nakidka/graph"
import chokidar from "chokidar"
import chalk from "chalk"
import { existsSync } from "fs"
import { hasFileChanged, readFileStats } from "../graph/fileStats"
import { projectGraphName } from "../graph/projectGraphName"
import {
  absoluteProjectFile,
  isSupportedProjectFile,
  normalizeProjectFile,
  readProjectFileList,
} from "../graph/projectFiles"
import { createWatchQueue } from "../graph/watchQueue"
import { updateGraphFiles } from "./updateGraph"

const WATCH_PATTERNS = [
  "**/Свойства.yaml",
  "**/Форма.yaml",
  "**/Форма.nkdk",
] as const

const PROJECT_FILE_ORDER = ["Свойства.yaml", "Форма.yaml", "Форма.nkdk"] as const

const projectFileOrder = (filePath: string): number => {
  const fileName = filePath.split("/").at(-1)
  const index = PROJECT_FILE_ORDER.findIndex((name) => name === fileName)
  return index === -1 ? PROJECT_FILE_ORDER.length : index
}

const compareProjectFiles = (left: string, right: string): number => {
  const leftDir = left.split("/").slice(0, -1).join("/")
  const rightDir = right.split("/").slice(0, -1).join("/")
  if (leftDir !== rightDir) return leftDir.localeCompare(rightDir)

  return projectFileOrder(left) - projectFileOrder(right)
}

const enqueueIfSupported = (
  projectPath: string,
  queue: ReturnType<typeof createWatchQueue>,
  path: string,
): void => {
  const filePath = normalizeProjectFile(projectPath, path)
  if (isSupportedProjectFile(filePath)) queue.enqueue(filePath)
}

const waitForWatcherReady = (watcher: ReturnType<typeof chokidar.watch>): Promise<void> => {
  return new Promise((resolve) => {
    watcher.on("ready", resolve)
  })
}

const isFileMissingError = (error: unknown): boolean => {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}

const collectChangedFiles = async (projectPath: string): Promise<string[]> => {
  const graphFiles = await getGraphFiles({ graphName: projectGraphName(projectPath) })
  const graphFileByPath = new Map(graphFiles.map((file) => [file.path, file]))
  const diskFiles = readProjectFileList(projectPath)
  const diskFileSet = new Set(diskFiles)
  const changed = new Set<string>()

  for (const filePath of diskFiles) {
    const fullPath = absoluteProjectFile(projectPath, filePath)
    let hasChanged: boolean
    try {
      hasChanged = hasFileChanged(graphFileByPath.get(filePath), readFileStats(fullPath))
    } catch (error) {
      if (!isFileMissingError(error)) throw error
      hasChanged = true
    }

    if (hasChanged) {
      changed.add(filePath)
    }
  }

  for (const file of graphFiles) {
    if (!diskFileSet.has(file.path)) changed.add(file.path)
  }

  return [...changed].sort(compareProjectFiles)
}

export async function watch(projectPath: string): Promise<void> {
  if (!existsSync(projectPath)) {
    throw new Error(`Директория не найдена: ${projectPath}`)
  }

  const queue = createWatchQueue({
    debounceMs: 150,
    runTask: async (filePaths) => {
      await updateGraphFiles(projectPath, filePaths)
    },
    onError: (filePaths, error) => {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(chalk.yellow(`Предупреждение: не удалось обновить граф для ${filePaths.join(", ")}: ${message}`))
    },
  })

  const watcher = chokidar.watch(
    WATCH_PATTERNS.map((pattern) => `${projectPath}/${pattern}`),
    { ignoreInitial: true },
  )

  watcher.on("add", (path) => {
    enqueueIfSupported(projectPath, queue, path)
  })
  watcher.on("change", (path) => {
    enqueueIfSupported(projectPath, queue, path)
  })
  watcher.on("unlink", (path) => {
    enqueueIfSupported(projectPath, queue, path)
  })

  await waitForWatcherReady(watcher)
  const changedFiles = await collectChangedFiles(projectPath)
  if (changedFiles.length > 0) await updateGraphFiles(projectPath, changedFiles)
  await queue.drain()

  process.once("SIGINT", () => {
    void queue.drain().finally(() => {
      void watcher.close().then(() => process.exit(0))
    })
  })
}
