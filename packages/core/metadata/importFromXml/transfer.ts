import { randomUUID } from "node:crypto"
import fs from "node:fs"
import { basename, dirname, isAbsolute, join, posix, relative, resolve, sep, win32 } from "node:path"
import pLimit from "p-limit"
import type { ImportResultFile } from "./types"

const DEFAULT_TRANSFER_CONCURRENCY = 16
const VIRTUAL_PROJECT_ROOT = "/__nkdk_project__"

interface ImportTransferFileHandle {
  sync(): Promise<void>
  close(): Promise<void>
}

interface ImportTransferFileOperations {
  mkdir(path: string): Promise<void>
  rename(source: string, target: string): Promise<void>
  copyFile(source: string, target: string): Promise<void>
  open(path: string): Promise<ImportTransferFileHandle>
}

interface TransferImportResultParams {
  projectDir: string
  files: readonly ImportResultFile[]
  concurrency?: number
}

const defaultFileOperations: ImportTransferFileOperations = {
  async mkdir(path) {
    await fs.promises.mkdir(path, { recursive: true })
  },
  rename: fs.promises.rename,
  copyFile: fs.promises.copyFile,
  async open(path) {
    return fs.promises.open(path, "r+")
  },
}

export function mergeImportResultFiles(files: readonly ImportResultFile[]): ImportResultFile[] {
  const targets = new Set<string>()
  for (const file of files) {
    const targetProjectPath = normalizedTargetProjectPath(file.targetProjectPath)
    if (targets.has(targetProjectPath)) throw new Error(`Повторный целевой путь: ${targetProjectPath}`)
    targets.add(targetProjectPath)
  }
  return [...files]
}

export async function transferImportResult(
  params: TransferImportResultParams,
  fileOperations: ImportTransferFileOperations = defaultFileOperations
): Promise<void> {
  const files = mergeImportResultFiles(params.files)
  const projectRoot = resolve(params.projectDir)
  const concurrency = normalizeConcurrency(params.concurrency)
  const preparedFiles = files.map((file) => ({
    file,
    targetPath: targetPathInsideProject(projectRoot, file.targetProjectPath),
  }))
  const limit = pLimit(concurrency)
  let aborted = false
  let failed = false
  let firstError: unknown

  const transfers = preparedFiles.map((prepared) =>
    limit(async () => {
      if (aborted) return
      try {
        await transferFile(prepared.file, prepared.targetPath, fileOperations)
      } catch (caught) {
        if (!failed) {
          failed = true
          firstError = caught
        }
        aborted = true
        throw caught
      }
    })
  )
  await Promise.allSettled(transfers)
  if (failed) throw firstError
}

async function transferFile(
  file: ImportResultFile,
  targetPath: string,
  fileOperations: ImportTransferFileOperations
): Promise<void> {
  const targetDirectory = dirname(targetPath)
  const temporaryPath = join(targetDirectory, `.${basename(targetPath)}.${randomUUID()}.tmp`)
  await fileOperations.mkdir(targetDirectory)

  if (file.sourceKind === "worker") {
    await fileOperations.rename(file.sourcePath, temporaryPath)
  } else {
    await fileOperations.copyFile(file.sourcePath, temporaryPath)
    const handle = await fileOperations.open(temporaryPath)
    try {
      await handle.sync()
    } finally {
      await handle.close()
    }
  }

  await fileOperations.rename(temporaryPath, targetPath)
}

function normalizedTargetProjectPath(targetProjectPath: string): string {
  const normalized = targetProjectPath.replace(/\\/g, "/")
  if (
    normalized.includes("\0") ||
    posix.isAbsolute(normalized) ||
    isAbsolute(targetProjectPath) ||
    win32.isAbsolute(targetProjectPath)
  ) {
    throw targetOutsideProjectError(targetProjectPath)
  }

  const target = posix.resolve(VIRTUAL_PROJECT_ROOT, normalized)
  const projectRelative = posix.relative(VIRTUAL_PROJECT_ROOT, target)
  if (projectRelative === "" || projectRelative === ".." || projectRelative.startsWith("../")) {
    throw targetOutsideProjectError(targetProjectPath)
  }
  return projectRelative
}

function targetPathInsideProject(projectRoot: string, targetProjectPath: string): string {
  const normalized = normalizedTargetProjectPath(targetProjectPath)
  const targetPath = resolve(projectRoot, ...normalized.split("/"))
  const projectRelative = relative(projectRoot, targetPath)
  if (
    projectRelative === "" ||
    projectRelative === ".." ||
    projectRelative.startsWith(`..${sep}`) ||
    isAbsolute(projectRelative)
  ) {
    throw targetOutsideProjectError(targetProjectPath)
  }
  return targetPath
}

function targetOutsideProjectError(targetProjectPath: string): Error {
  return new Error(`Целевой путь вне Проекта: ${targetProjectPath}`)
}

function normalizeConcurrency(concurrency: number | undefined): number {
  if (concurrency === undefined) return DEFAULT_TRANSFER_CONCURRENCY
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new Error("Степень параллелизма публикации XML-import должна быть положительным целым числом")
  }
  return concurrency
}
