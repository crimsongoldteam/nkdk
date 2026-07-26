import fs from "node:fs"
import { join } from "node:path"
import { parse, stringify } from "yaml"
import { parseConnection } from "../infobases/parseConnection"
import { PlatformSessionError } from "../sessions/errors"
import type {
  NormalizedPlatformConnectionSettings,
  PlatformConnectionSettings,
  ProjectSettings,
} from "../sessions/types"

const DEFAULT_SESSION_IDLE_TIMEOUT = 900
const PRIVATE_FILE_MODE = 0o600

export interface ProjectSettingsFileSystem {
  readFile(path: string): Promise<string>
  mkdir(path: string): Promise<void>
  writeFile(path: string, content: string, options?: { mode?: number }): Promise<void>
  chmod(path: string, mode: number): Promise<void>
}

export interface ProjectSettingsDependencies {
  fileSystem: ProjectSettingsFileSystem
  platform: NodeJS.Platform
}

const defaultFileSystem: ProjectSettingsFileSystem = {
  async readFile(path) {
    return fs.promises.readFile(path, "utf8")
  },
  async mkdir(path) {
    await fs.promises.mkdir(path, { recursive: true })
  },
  async writeFile(path, content, options) {
    await fs.promises.writeFile(path, content, options)
  },
  chmod: fs.promises.chmod,
}

const defaultDependencies: ProjectSettingsDependencies = {
  fileSystem: defaultFileSystem,
  platform: process.platform,
}

export function parseProjectSettings(source: string): ProjectSettings {
  let parsed: unknown
  try {
    parsed = parse(source)
  } catch (caught) {
    throw invalidSettings("Некорректный YAML файла настроек", caught)
  }
  if (!isRecord(parsed) || parsed["version"] !== 1 || !isRecord(parsed["infobase"])) {
    throw invalidSettings("Поддерживается только версия 1 файла настроек")
  }
  return {
    version: 1,
    infobase: normalizePlatformConnectionSettings(parsed["infobase"]),
  }
}

export async function readProjectSettings(
  projectDir: string,
  dependencies: ProjectSettingsDependencies = defaultDependencies
): Promise<ProjectSettings | undefined> {
  const settingsPath = projectSettingsPath(projectDir)
  try {
    return parseProjectSettings(await dependencies.fileSystem.readFile(settingsPath))
  } catch (caught) {
    if (isFileSystemError(caught, "ENOENT")) return undefined
    throw caught
  }
}

export async function writeProjectSettings(
  params: { projectDir: string; infobase: PlatformConnectionSettings },
  dependencies: ProjectSettingsDependencies = defaultDependencies
): Promise<{ settingsPath: string }> {
  const infobase = normalizePlatformConnectionSettings(params.infobase)
  const nkdkDir = join(params.projectDir, ".nkdk")
  const settingsPath = projectSettingsPath(params.projectDir)
  try {
    await dependencies.fileSystem.mkdir(nkdkDir)
    await dependencies.fileSystem.writeFile(join(nkdkDir, ".gitignore"), "*\n!.gitignore\n")
    await dependencies.fileSystem.writeFile(
      settingsPath,
      stringify({ version: 1, infobase }),
      { mode: PRIVATE_FILE_MODE }
    )
    if (dependencies.platform !== "win32") {
      await dependencies.fileSystem.chmod(settingsPath, PRIVATE_FILE_MODE)
    }
  } catch {
    throw invalidSettings("Не удалось безопасно записать файл настроек проекта")
  }
  return { settingsPath }
}

export function normalizePlatformConnectionSettings(
  value: unknown
): NormalizedPlatformConnectionSettings {
  if (!isRecord(value) || typeof value["connectionString"] !== "string" || value["connectionString"].trim() === "") {
    throw invalidSettings("Не задана строка подключения к информационной базе")
  }
  const connectionString = value["connectionString"]
  const connection = parseConnection(connectionString)
  if (connection.type !== "file" && connection.type !== "server") {
    throw invalidSettings("Поддерживаются только файловые и клиент-серверные информационные базы")
  }

  const user = optionalString(value["user"], "Имя пользователя")
  const password = optionalString(value["password"], "Пароль")
  const useStandaloneServer = optionalBoolean(value["useStandaloneServer"], false)
  const sessionIdleTimeout = optionalPositiveInteger(
    value["sessionIdleTimeout"],
    DEFAULT_SESSION_IDLE_TIMEOUT
  )
  if (useStandaloneServer && connection.type !== "file") {
    throw invalidSettings("Автономный сервер поддерживает только файловую информационную базу")
  }

  return {
    connectionString,
    ...(user === undefined ? {} : { user }),
    ...(password === undefined ? {} : { password }),
    useStandaloneServer,
    sessionIdleTimeout,
  }
}

function optionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== "string") throw invalidSettings(`${fieldName} должен быть строкой`)
  if (/[\0\r\n]/.test(value)) {
    throw invalidSettings(`${fieldName} содержит недопустимые управляющие символы`)
  }
  return value
}

function optionalBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback
  if (typeof value !== "boolean") throw invalidSettings("useStandaloneServer должен быть логическим значением")
  return value
}

function optionalPositiveInteger(value: unknown, fallback: number): number {
  if (value === undefined) return fallback
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw invalidSettings("sessionIdleTimeout должен быть положительным целым числом секунд")
  }
  return value as number
}

function projectSettingsPath(projectDir: string): string {
  return join(projectDir, ".nkdk", "project.yaml")
}

function invalidSettings(message: string, cause?: unknown): PlatformSessionError {
  return new PlatformSessionError(
    "invalid_project_settings",
    message,
    cause === undefined ? undefined : { cause }
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isFileSystemError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === code
}
