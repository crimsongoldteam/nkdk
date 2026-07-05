import type { TSchema } from "@sinclairtypebox"
import { isAbsolute, relative, resolve, sep } from "path"
import type { ConfigurationContext, JSONSchemaExportMode } from "../context/types"
import { classifyMetadataProjectPath } from "../project/resources"
import {
  ensureJSONSchemaRegistry,
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
  "Ожидались Конфигурация.yaml или пути вида <Вид>/<Имя>/Свойства.yaml и <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"

export function exportJSONSchemaForProjectFile(params: ExportJSONSchemaForProjectFileParams): TSchema {
  ensureJSONSchemaRegistry()
  const normalized = normalizeProjectPath(params)

  if (!normalized.toLowerCase().endsWith(".yaml")) {
    throw new ProjectFileSchemaError("JSON Schema поддерживается только для .yaml файлов")
  }

  const resource = classifyMetadataProjectPath(normalized)
  if (!resource) {
    throw new ProjectFileSchemaError(expectedPatterns)
  }

  if (resource.kind !== "yaml") {
    throw new ProjectFileSchemaError("JSON Schema для этого вида metadata-ресурса не поддерживается")
  }

  if (resource.role === "form") {
    return exportRegisteredJSONSchemaForSchemaName({
      context: params.context,
      name: "ClientApplicationForm",
      mode: params.mode,
    })
  }

  if (resource.role === "configuration") {
    return resource.owner.spec.exportSchema({
      context: params.context,
      mode: params.mode,
    })
  }

  if (resource.role === "properties") {
    return resource.owner.spec.exportSchema({
      context: params.context,
      mode: params.mode,
      name: resource.owner.name,
    })
  }

  throw new ProjectFileSchemaError("JSON Schema для этого вида metadata-ресурса не поддерживается")
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
