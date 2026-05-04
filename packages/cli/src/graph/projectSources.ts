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

export interface ChangedProjectSources {
  sources: ProjectGraphSource[]
  deletedFilePaths: string[]
}

export interface ReadProjectGraphSourcesOptions {
  includePairedText?: boolean
}

const normalizeChangedFile = (projectPath: string, filePath: string): string => {
  if (!isAbsolute(filePath)) return filePath

  const relativePath = relative(projectPath, filePath)
  if (relativePath.startsWith("..")) return filePath
  return normalizeProjectFile(projectPath, filePath)
}

const readSource = (
  projectPath: string,
  filePath: string,
  options: ReadProjectGraphSourcesOptions = {},
): ProjectGraphSource => {
  const fullPath = absoluteProjectFile(projectPath, filePath)
  const pairedPath = pairedFormPath(filePath)
  const pairedFullPath = pairedPath ? absoluteProjectFile(projectPath, pairedPath) : undefined
  const pairedText =
    options.includePairedText !== false && pairedPath && pairedFullPath && existsSync(pairedFullPath)
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

export const readProjectGraphSources = (
  projectPath: string,
  options: ReadProjectGraphSourcesOptions = {},
): ProjectGraphSource[] => {
  return readProjectFileList(projectPath)
    .filter((filePath) => filePath.endsWith(".yaml"))
    .map((filePath) => readSource(projectPath, filePath, options))
}

export const readChangedProjectSources = (
  projectPath: string,
  filePaths: readonly string[],
): ChangedProjectSources => {
  const primaryPaths = new Set<string>()
  const explicitlyChanged = new Set<string>()

  for (const filePath of filePaths) {
    const normalizedFilePath = normalizeChangedFile(projectPath, filePath)
    explicitlyChanged.add(normalizedFilePath)

    const primaryFilePath = normalizedFilePath.endsWith("/Форма.nkdk")
      ? pairedFormPath(normalizedFilePath)
      : normalizedFilePath

    if (primaryFilePath) primaryPaths.add(primaryFilePath)
    else explicitlyChanged.add(normalizedFilePath)
  }

  const sources: ProjectGraphSource[] = []
  const deletedFilePaths = new Set<string>()

  for (const primaryFilePath of [...primaryPaths].sort()) {
    const fullPath = absoluteProjectFile(projectPath, primaryFilePath)
    const pairedPath = pairedFormPath(primaryFilePath)

    if (!existsSync(fullPath)) {
      const deletedPaths =
        pairedPath && !explicitlyChanged.has(primaryFilePath)
          ? [pairedPath]
          : deletedPathsFor(primaryFilePath)

      for (const deletedFilePath of deletedPaths) {
        deletedFilePaths.add(deletedFilePath)
      }
      continue
    }

    const source = readSource(projectPath, primaryFilePath)
    sources.push(source)

    if (
      pairedPath &&
      explicitlyChanged.has(pairedPath) &&
      !existsSync(absoluteProjectFile(projectPath, pairedPath))
    ) {
      deletedFilePaths.add(pairedPath)
    }
  }

  return {
    sources,
    deletedFilePaths: [...deletedFilePaths],
  }
}

export const readChangedProjectSource = (
  projectPath: string,
  filePath: string,
): ChangedProjectSource => {
  const changed = readChangedProjectSources(projectPath, [filePath])
  const source = changed.sources[0]
  const result: ChangedProjectSource = {
    deleted: changed.sources.length === 0,
    deletedFilePaths: changed.deletedFilePaths,
  }

  if (source) result.source = source
  return result
}
