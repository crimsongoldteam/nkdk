import {
  discoverProjectGraphFiles,
  isSupportedProjectGraphFile,
  pairedProjectGraphFile,
} from "@nakidka/core"
import { join, relative, sep } from "path"

export function normalizeProjectFile(projectPath: string, path: string): string {
  return relative(projectPath, path).split(sep).join("/")
}

export function absoluteProjectFile(projectPath: string, filePath: string): string {
  return join(projectPath, ...filePath.split("/"))
}

export function pairedFormPath(filePath: string): string | undefined {
  return pairedProjectGraphFile(filePath)
}

export function isSupportedProjectFile(filePath: string): boolean {
  return isSupportedProjectGraphFile(filePath)
}

export function readProjectFileList(projectPath: string): string[] {
  return discoverProjectGraphFiles(projectPath)
}
