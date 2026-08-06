import fs from "node:fs"
import { join } from "node:path"
import { parse } from "yaml"
import type { z } from "zod"
import { parseConnection } from "../infobases/parseConnection"
import type {
  NormalizedPlatformConnectionSettings,
  PlatformConnectionSettings,
  ProjectSettings,
} from "../sessions/types"
import { projectSettingsStructuralSchema } from "./projectSettingsSchema"

const PRIVATE_FILE_MODE = 0o600

export type ProjectSettingsDiagnostic = {
  code: string
  path: string
  message: string
}

export type ProjectSettingsValidationResult =
  | { ok: true; settings: ProjectSettings }
  | { ok: false; diagnostics: ProjectSettingsDiagnostic[] }

export type ProjectSettingsReadResult =
  | { status: "ready"; projectDir: string; settingsPath: string; settings: ProjectSettings }
  | { status: "missing"; projectDir: string; settingsPath: string }
  | { status: "invalid"; projectDir: string; settingsPath: string; diagnostics: ProjectSettingsDiagnostic[] }

export interface ProjectSettingsFileSystem {
  realpath(path: string): Promise<string>
  chmod(path: string, mode: number): Promise<void>
  readFile(path: string): Promise<string>
}

export interface ProjectSettingsDependencies {
  fileSystem: ProjectSettingsFileSystem
  platform: NodeJS.Platform
}

const defaultFileSystem: ProjectSettingsFileSystem = {
  realpath: fs.promises.realpath,
  chmod: fs.promises.chmod,
  async readFile(path) {
    return fs.promises.readFile(path, "utf8")
  },
}

const defaultDependencies: ProjectSettingsDependencies = {
  fileSystem: defaultFileSystem,
  platform: process.platform,
}

class ProjectSettingsYamlSyntaxError extends Error {}

export function parseProjectSettingsYaml(source: string): unknown {
  try {
    return parse(source)
  } catch (cause) {
    throw new ProjectSettingsYamlSyntaxError("Некорректный YAML файла настроек", { cause })
  }
}

export function validateProjectSettings(value: unknown): ProjectSettingsValidationResult {
  const parsed = projectSettingsStructuralSchema.safeParse(value)
  if (!parsed.success) {
    return { ok: false, diagnostics: zodDiagnostics(parsed.error.issues) }
  }

  const settings = parsed.data as ProjectSettings
  const diagnostics = semanticDiagnostics(settings)
  return diagnostics.length === 0 ? { ok: true, settings } : { ok: false, diagnostics }
}

export async function readProjectSettings(
  projectDir: string,
  dependencies: ProjectSettingsDependencies = defaultDependencies
): Promise<ProjectSettingsReadResult> {
  let canonicalProjectDir: string
  try {
    canonicalProjectDir = await dependencies.fileSystem.realpath(projectDir)
  } catch {
    const settingsPath = projectSettingsPath(projectDir)
    return invalidRead(projectDir, settingsPath, "project_access_failed", "$", "Не удалось открыть каталог проекта")
  }
  const settingsPath = projectSettingsPath(canonicalProjectDir)

  if (dependencies.platform !== "win32") {
    try {
      await dependencies.fileSystem.chmod(settingsPath, PRIVATE_FILE_MODE)
    } catch (error) {
      if (isFileSystemError(error, "ENOENT")) return { status: "missing", projectDir: canonicalProjectDir, settingsPath }
      return invalidRead(canonicalProjectDir, settingsPath, "project_settings_access_failed", "$", "Не удалось защитить файл настроек проекта")
    }
  }

  let source: string
  try {
    source = await dependencies.fileSystem.readFile(settingsPath)
  } catch (error) {
    if (isFileSystemError(error, "ENOENT")) return { status: "missing", projectDir: canonicalProjectDir, settingsPath }
    return invalidRead(canonicalProjectDir, settingsPath, "project_settings_access_failed", "$", "Не удалось прочитать файл настроек проекта")
  }

  let value: unknown
  try {
    value = parseProjectSettingsYaml(source)
  } catch (error) {
    if (error instanceof ProjectSettingsYamlSyntaxError) {
      return invalidRead(canonicalProjectDir, settingsPath, "invalid_yaml", "$", error.message)
    }
    throw error
  }

  const validation = validateProjectSettings(value)
  return validation.ok
    ? { status: "ready", projectDir: canonicalProjectDir, settingsPath, settings: validation.settings }
    : { status: "invalid", projectDir: canonicalProjectDir, settingsPath, diagnostics: validation.diagnostics }
}

// Временная внутренняя граница старого менеджера; удаляется при переводе операций на явный mode.
export function normalizePlatformConnectionSettings(
  value: PlatformConnectionSettings
): NormalizedPlatformConnectionSettings & { useStandaloneServer: boolean } {
  const infobase = {
    connectionString: value.connectionString,
    ...(value.user === undefined ? {} : { user: value.user }),
    ...(value.password === undefined ? {} : { password: value.password }),
    ...(value.sessionIdleTimeout === undefined ? {} : { sessionIdleTimeout: value.sessionIdleTimeout }),
    ...(value.database === undefined ? {} : { database: value.database }),
  }
  const result = validateProjectSettings({
    infobase: {
      ...infobase,
      operations: { import: { mode: value.useStandaloneServer === true ? "standalone-server" : "designer-agent" } },
    },
  })
  if (!result.ok) throw new Error(result.diagnostics[0]?.message ?? "Некорректные настройки подключения")
  const { operations: _operations, ...settings } = result.settings.infobase
  return { ...settings, useStandaloneServer: value.useStandaloneServer === true }
}

function semanticDiagnostics(settings: ProjectSettings): ProjectSettingsDiagnostic[] {
  const diagnostics: ProjectSettingsDiagnostic[] = []
  let connection: ReturnType<typeof parseConnection>
  try {
    connection = parseConnection(settings.infobase.connectionString)
  } catch {
    return [diagnostic("unsupported_connection", "infobase.connectionString", "Строка подключения не поддерживается")]
  }
  if (connection.type !== "file" && connection.type !== "server") {
    diagnostics.push(diagnostic("unsupported_connection", "infobase.connectionString", "Поддерживаются только файловые и клиент-серверные базы"))
    return diagnostics
  }

  const { database, operations } = settings.infobase
  if (connection.type === "file" && database !== undefined) {
    diagnostics.push(diagnostic("database_not_allowed", "infobase.database", "Параметры СУБД нельзя задавать для файловой базы"))
  }
  if (connection.type === "server" && operations.import.mode === "standalone-server" && database === undefined) {
    diagnostics.push(diagnostic("database_required", "infobase.database", "Для автономного сервера клиент-серверной базы нужны параметры СУБД"))
  }
  if (database?.password !== undefined && database.user === undefined) {
    diagnostics.push(diagnostic("database_user_required", "infobase.database.user", "Для пароля СУБД нужно указать пользователя"))
  }
  if (database !== undefined && database.dbms !== "MSSQLServer" && database.user === undefined) {
    diagnostics.push(diagnostic("database_user_required", "infobase.database.user", "Для выбранной СУБД нужно указать пользователя"))
  }
  return diagnostics
}

function zodDiagnostics(issues: z.core.$ZodIssue[]): ProjectSettingsDiagnostic[] {
  return issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys") {
      return issue.keys.map((key) => diagnostic("unknown_field", [...issue.path, key].join("."), "Неизвестное поле настроек"))
    }
    return [diagnostic("invalid_project_settings", issue.path.join(".") || "$", issue.message)]
  })
}

function diagnostic(code: string, path: string, message: string): ProjectSettingsDiagnostic {
  return { code, path, message }
}

function invalidRead(
  projectDir: string,
  settingsPath: string,
  code: string,
  path: string,
  message: string
): ProjectSettingsReadResult {
  return { status: "invalid", projectDir, settingsPath, diagnostics: [diagnostic(code, path, message)] }
}

function projectSettingsPath(projectDir: string): string {
  return join(projectDir, ".nkdk", "project.yaml")
}

function isFileSystemError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === code
}
