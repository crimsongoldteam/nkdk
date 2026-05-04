import type { ProjectGraphSource } from "@nakidka/core"
import { existsSync, readFileSync } from "fs"
import { isAbsolute, relative } from "path"
import { readFileStats } from "./fileStats"
import {
  absoluteProjectFile,
  normalizeProjectFile,
  pairedFormPath,
  readProjectFileList,
} from "./projectFiles"

export interface ChangedProjectSource {
  deleted: boolean
  source?: ProjectGraphSource
  deletedFilePaths: string[]
}

const normalizeChangedFile = (projectPath: string, filePath: string): string => {
  if (!isAbsolute(filePath)) return filePath

  const relativePath = relative(projectPath, filePath)
  if (relativePath.startsWith("..")) return filePath
  return normalizeProjectFile(projectPath, filePath)
}

const readSource = (projectPath: string, filePath: string): ProjectGraphSource => {
  const fullPath = absoluteProjectFile(projectPath, filePath)
  const pairedPath = pairedFormPath(filePath)
  const pairedFullPath = pairedPath ? absoluteProjectFile(projectPath, pairedPath) : undefined
  const pairedText =
    pairedPath && pairedFullPath && existsSync(pairedFullPath)
      ? {
          filePath: pairedPath,
          text: readFileSync(pairedFullPath, "utf-8"),
          fileStats: readFileStats(pairedFullPath),
        }
      : undefined

  return {
    filePath,
    text: readFileSync(fullPath, "utf-8"),
    fileStats: readFileStats(fullPath),
    pairedText,
  }
}

const deletedPathsFor = (filePath: string): string[] => {
  const pairedPath = pairedFormPath(filePath)
  return pairedPath ? [filePath, pairedPath] : [filePath]
}

export const readProjectGraphSources = (projectPath: string): ProjectGraphSource[] => {
  return readProjectFileList(projectPath)
    .filter((filePath) => filePath.endsWith(".yaml"))
    .map((filePath) => readSource(projectPath, filePath))
}

export const readChangedProjectSource = (
  projectPath: string,
  filePath: string,
): ChangedProjectSource => {
  const normalizedFilePath = normalizeChangedFile(projectPath, filePath)
  const primaryFilePath = normalizedFilePath.endsWith("/Форма.nkdk")
    ? pairedFormPath(normalizedFilePath)
    : normalizedFilePath

  if (!primaryFilePath) {
    return { deleted: true, deletedFilePaths: [normalizedFilePath] }
  }

  const fullPath = absoluteProjectFile(projectPath, primaryFilePath)
  if (!existsSync(fullPath)) {
    return { deleted: true, deletedFilePaths: deletedPathsFor(primaryFilePath) }
  }

  const source = readSource(projectPath, primaryFilePath)
  const pairedPath = pairedFormPath(primaryFilePath)
  const deletedFilePaths =
    pairedPath && !existsSync(absoluteProjectFile(projectPath, pairedPath)) ? [pairedPath] : []

  return { deleted: false, source, deletedFilePaths }
}
