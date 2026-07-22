import fs from "node:fs"
import { dirname, isAbsolute, posix, relative, resolve, sep, win32 } from "node:path"
import pLimit from "p-limit"
import type { ImportResultFile } from "./types"

const DEFAULT_COPY_CONCURRENCY = 16
const VIRTUAL_PROJECT_ROOT = "/__nkdk_project__"

interface ImportTransferFileOperations {
  realpath(path: string): Promise<string>
  mkdir(path: string): Promise<void>
  copyFile(source: string, target: string): Promise<void>
}

interface TransferImportResultParams {
  projectDir: string
  files: readonly ImportResultFile[]
  concurrency?: number
}

const defaultFileOperations: ImportTransferFileOperations = {
  realpath: fs.promises.realpath,
  async mkdir(path) {
    await fs.promises.mkdir(path, { recursive: true })
  },
  copyFile: fs.promises.copyFile,
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

export async function copyXmlImportExternalFiles(
  params: TransferImportResultParams,
  fileOperations: ImportTransferFileOperations = defaultFileOperations
): Promise<void> {
  const xmlFiles = mergeImportResultFiles(params.files).filter((file) => file.sourceKind === "xml")
  if (xmlFiles.length === 0) return

  const projectRoot = resolve(params.projectDir)
  const concurrency = normalizeConcurrency(params.concurrency)
  const realProjectRoot = await fileOperations.realpath(projectRoot)
  const preparedFiles = await Promise.all(
    xmlFiles.map(async (file) => {
      const targetPath = targetPathInsideProject(projectRoot, file.targetProjectPath)
      await assertRealTargetInsideProject(realProjectRoot, dirname(targetPath), file.targetProjectPath, fileOperations)
      return { file, targetPath }
    })
  )
  const limit = pLimit(concurrency)
  await Promise.all(
    preparedFiles.map((prepared) =>
      limit(async () => {
        await fileOperations.mkdir(dirname(prepared.targetPath))
        await fileOperations.copyFile(prepared.file.sourcePath, prepared.targetPath)
      })
    )
  )
}

async function assertRealTargetInsideProject(
  realProjectRoot: string,
  targetDirectory: string,
  targetProjectPath: string,
  fileOperations: ImportTransferFileOperations
): Promise<void> {
  const realExistingDirectory = await realpathClosestExistingAncestor(targetDirectory, fileOperations)
  const projectRelative = relative(realProjectRoot, realExistingDirectory)
  if (projectRelative === ".." || projectRelative.startsWith(`..${sep}`) || isAbsolute(projectRelative)) {
    throw targetOutsideProjectError(targetProjectPath)
  }
}

async function realpathClosestExistingAncestor(
  path: string,
  fileOperations: ImportTransferFileOperations
): Promise<string> {
  let candidate = path
  for (;;) {
    try {
      return await fileOperations.realpath(candidate)
    } catch (caught) {
      if (!isFileSystemError(caught, "ENOENT")) throw caught
      const parent = dirname(candidate)
      if (parent === candidate) throw caught
      candidate = parent
    }
  }
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
  if (concurrency === undefined) return DEFAULT_COPY_CONCURRENCY
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new Error("Степень параллелизма копирования XML-import должна быть положительным целым числом")
  }
  return concurrency
}

function isFileSystemError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === code
}
