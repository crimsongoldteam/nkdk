export type PlatformOs = "win32" | "linux" | "darwin"
export type PlatformArchitecture = "x86" | "x64" | "arm64" | "unknown"

export type FileStat = {
  isFile: boolean
  isDirectory: boolean
  mode: number
}

export type FileSystem = {
  readFile(path: string): Promise<string>
  readdir(path: string): Promise<string[]>
  stat(path: string): Promise<FileStat>
  realpath(path: string): Promise<string>
}

export type PlatformEnvironment = {
  os: PlatformOs
  arch: PlatformArchitecture
  env: Readonly<Record<string, string | undefined>>
}

export type PlatformRuntime = {
  fs: FileSystem
  environment: PlatformEnvironment
}

function normalizePlatform(value: NodeJS.Platform): PlatformOs {
  if (value === "win32" || value === "linux" || value === "darwin") return value
  throw new Error(`Неподдерживаемая операционная система: ${value}`)
}

function normalizeArchitecture(value: string): PlatformArchitecture {
  if (value === "ia32") return "x86"
  if (value === "x64" || value === "arm64") return value
  return "unknown"
}

export const nodePlatformRuntime: PlatformRuntime = {
  fs: {
    readFile: (path) => readFile(path, "utf8"),
    readdir,
    realpath,
    stat: async (path) => {
      const value = await stat(path)
      return { isFile: value.isFile(), isDirectory: value.isDirectory(), mode: value.mode }
    },
  },
  environment: {
    os: normalizePlatform(process.platform),
    arch: normalizeArchitecture(process.arch),
    env: process.env,
  },
}
import { readFile, readdir, realpath, stat } from "node:fs/promises"
