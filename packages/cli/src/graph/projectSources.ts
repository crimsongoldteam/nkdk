import type { ProjectGraphSource } from "@nakidka/core"
import { existsSync, readFileSync } from "fs"
import { isAbsolute, relative } from "path"
import { readFileStats } from "./fileStats"
import {
  absoluteProjectFile,
  isSupportedProjectFile,
  normalizeProjectFile,
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

const normalizeChangedFile = (projectPath: string, filePath: string): string => {
  if (!isAbsolute(filePath)) return filePath

  const relativePath = relative(projectPath, filePath)
  if (relativePath.startsWith("..")) return filePath
  return normalizeProjectFile(projectPath, filePath)
}

const readSource = (
  projectPath: string,
  filePath: string,
): ProjectGraphSource => {
  const fullPath = absoluteProjectFile(projectPath, filePath)

  return {
    filePath,
    text: readFileSync(fullPath, "utf-8"),
    fileStats: readFileStats(fullPath),
  }
}

export const readProjectGraphSources = (projectPath: string): ProjectGraphSource[] => {
  return readProjectFileList(projectPath)
    .filter((filePath) => filePath.endsWith(".yaml"))
    .map((filePath) => readSource(projectPath, filePath))
}

export const readChangedProjectSources = (
  projectPath: string,
  filePaths: readonly string[],
): ChangedProjectSources => {
  const projectFilePaths = new Set<string>()

  for (const filePath of filePaths) {
    const normalizedFilePath = normalizeChangedFile(projectPath, filePath)
    if (isSupportedProjectFile(normalizedFilePath)) {
      projectFilePaths.add(normalizedFilePath)
    }
  }

  const sources: ProjectGraphSource[] = []
  const deletedFilePaths = new Set<string>()

  for (const filePath of [...projectFilePaths].sort()) {
    const fullPath = absoluteProjectFile(projectPath, filePath)

    if (!existsSync(fullPath)) {
      deletedFilePaths.add(filePath)
      continue
    }

    const source = readSource(projectPath, filePath)
    sources.push(source)
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
