import { posix } from "node:path"

export function compareConfigurationIndexUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}

export function configurationIndexErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function validateConfigurationIndexProjectPath(projectPath: string): string {
  if (projectPath.length === 0 || projectPath.includes("\0") || projectPath.includes("\\")) {
    throw new Error(`Недопустимый project path: ${projectPath}`)
  }
  if (posix.isAbsolute(projectPath) || posix.normalize(projectPath) !== projectPath) {
    throw new Error(`Недопустимый project path: ${projectPath}`)
  }
  const encoded = Buffer.from(projectPath, "utf8")
  if (new TextDecoder("utf-8", { fatal: true }).decode(encoded) !== projectPath) {
    throw new Error(`Недопустимый UTF-8 project path: ${projectPath}`)
  }
  return projectPath
}
