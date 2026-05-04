import { getGraphFiles } from "@nakidka/graph"
import chokidar from "chokidar"
import { hasFileChanged, readFileStats } from "../graph/fileStats"
import {
  absoluteProjectFile,
  isSupportedProjectFile,
  normalizeProjectFile,
  pairedFormPath,
  readProjectFileList,
} from "../graph/projectFiles"
import { createWatchQueue } from "../graph/watchQueue"
import { updateGraphFile } from "./updateGraph"

const WATCH_PATTERNS = [
  "**/Свойства.yaml",
  "**/Форма.yaml",
  "**/Форма.nkdk",
] as const

const enqueueIfSupported = (
  projectPath: string,
  queue: ReturnType<typeof createWatchQueue>,
  path: string,
): void => {
  const filePath = normalizeProjectFile(projectPath, path)
  if (isSupportedProjectFile(filePath)) queue.enqueue(filePath)
}

export async function watch(projectPath: string): Promise<void> {
  const graphFiles = await getGraphFiles()
  const graphFileByPath = new Map(graphFiles.map((file) => [file.path, file]))
  const diskFiles = readProjectFileList(projectPath)
  const diskFileSet = new Set(diskFiles)

  for (const filePath of diskFiles) {
    const fullPath = absoluteProjectFile(projectPath, filePath)
    const stats = readFileStats(fullPath)
    if (hasFileChanged(graphFileByPath.get(filePath), stats)) {
      await updateGraphFile(projectPath, filePath)
    }
  }

  for (const file of graphFiles) {
    if (diskFileSet.has(file.path)) continue

    await updateGraphFile(projectPath, file.path)
    const paired = pairedFormPath(file.path)
    if (file.path.endsWith("/Форма.yaml") && paired) {
      await updateGraphFile(projectPath, paired)
    }
  }

  const queue = createWatchQueue({
    debounceMs: 150,
    runTask: async (filePath) => {
      await updateGraphFile(projectPath, filePath)
      const paired = pairedFormPath(filePath)
      if (filePath.endsWith("/Форма.yaml") && paired) {
        await updateGraphFile(projectPath, paired)
      }
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
    const filePath = normalizeProjectFile(projectPath, path)
    if (!isSupportedProjectFile(filePath)) return

    queue.enqueue(filePath)
    const paired = pairedFormPath(filePath)
    if (filePath.endsWith("/Форма.yaml") && paired) queue.enqueue(paired)
  })

  process.once("SIGINT", () => {
    void queue.drain().finally(() => {
      void watcher.close().then(() => process.exit(0))
    })
  })
}
