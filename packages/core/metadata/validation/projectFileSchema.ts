import type { TSchema } from "@sinclair/typebox"
import { isAbsolute, relative, resolve, sep } from "path"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import { getValidationProjectSpecByDir, type ValidationProjectSpec } from "./projectSpecs"
import {
  exportJSONSchemaForSchemaName as exportRegisteredJSONSchemaForSchemaName,
  ProjectFileSchemaError,
} from "./schemaRegistry"

export { ProjectFileSchemaError } from "./schemaRegistry"

export interface ExportJSONSchemaForProjectFileParams {
  context: ConfigurationContext
  filePath: string
  projectDir?: string
  mode?: JSONSchemaExportMode
}

export interface ExportJSONSchemaForSchemaNameParams {
  context: ConfigurationContext
  name: string
  mode?: JSONSchemaExportMode
}

const expectedPatterns =
  "Ожидались пути вида <Вид>/<Имя>/Свойства.yaml или <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"

export function exportJSONSchemaForProjectFile(params: ExportJSONSchemaForProjectFileParams): TSchema {
  const { context } = params
  const normalized = normalizeProjectPath(params)
  const parts = normalized.split("/")

  if (!normalized.toLowerCase().endsWith(".yaml")) {
    throw new ProjectFileSchemaError("JSON Schema поддерживается только для .yaml файлов")
  }

  if (isFormPath(parts)) {
    return exportRegisteredJSONSchemaForSchemaName({
      context,
      name: "ClientApplicationForm",
      mode: params.mode,
    })
  }

  const spec = findPropertiesPath(parts)?.spec
  if (spec) {
    return spec.exportSchema({
      context,
      mode: params.mode,
    })
  }

  throw new ProjectFileSchemaError(expectedPatterns)
}

export function exportJSONSchemaForSchemaName(params: ExportJSONSchemaForSchemaNameParams): TSchema {
  return exportRegisteredJSONSchemaForSchemaName(params)
}

function normalizeProjectPath(params: Pick<ExportJSONSchemaForProjectFileParams, "filePath" | "projectDir">): string {
  const { filePath, projectDir } = params
  const fullPath = projectDir && !isAbsolute(filePath) ? resolve(projectDir, filePath) : resolve(filePath)

  if (projectDir) {
    const projectPath = resolve(projectDir)
    const relativePath = relative(projectPath, fullPath)
    if (relativePath === "" || relativePath.startsWith("..") || isAbsolute(relativePath)) {
      throw new ProjectFileSchemaError("Файл находится вне указанного YAML-проекта")
    }
    return toProjectSeparators(relativePath)
  }

  return toProjectSeparators(filePath)
}

function toProjectSeparators(filePath: string): string {
  return filePath.split(sep).join("/")
}

function isFormPath(parts: string[]): boolean {
  const ownerDir = parts[parts.length - 5]

  return (
    parts.length >= 5 &&
    parts[parts.length - 3] === "Формы" &&
    parts[parts.length - 2] !== "" &&
    parts[parts.length - 1] === "Форма.yaml" &&
    ownerDir !== undefined &&
    hasValidationProjectSpec(ownerDir)
  )
}

function findPropertiesPath(parts: string[]): { spec: ValidationProjectSpec } | undefined {
  if (parts.length < 3 || parts[parts.length - 1] !== "Свойства.yaml") return undefined

  const objectDir = parts[parts.length - 3]
  if (!objectDir) return undefined

  const spec = getValidationProjectSpecByDir(objectDir)
  if (!spec) return undefined

  return { spec }
}

function hasValidationProjectSpec(dir: string): boolean {
  return getValidationProjectSpecByDir(dir) !== undefined
}
