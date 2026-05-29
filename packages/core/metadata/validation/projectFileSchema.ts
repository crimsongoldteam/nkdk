import type { TSchema } from "@sinclair/typebox"
import { isAbsolute, relative, resolve, sep } from "path"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
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

const metadataSchemaNameByDir = {
  Справочник: "MetadataCatalog",
  Документ: "MetadataDocument",
  Перечисление: "MetadataEnumeration",
  Обработка: "MetadataDataProcessor",
  ЖурналДокументов: "MetadataDocumentJournal",
  HTTPСервис: "MetadataHTTPService",
  РегистрСведений: "MetadataInformationRegister",
  РегистрНакопления: "MetadataAccumulationRegister",
  ПланОбмена: "MetadataExchangePlan",
} satisfies Record<string, string>

export function exportJSONSchemaForProjectFile(params: ExportJSONSchemaForProjectFileParams): TSchema {
  const { context } = params
  const normalized = normalizeProjectPath(params)
  const parts = normalized.split("/")

  if (!normalized.toLowerCase().endsWith(".yaml")) {
    throw new ProjectFileSchemaError("JSON Schema поддерживается только для .yaml файлов")
  }

  let schemaName: string | undefined

  if (isFormPath(parts)) {
    schemaName = "ClientApplicationForm"
  } else {
    schemaName = findPropertiesPath(parts)?.schemaName
  }

  if (!schemaName) {
    throw new ProjectFileSchemaError(expectedPatterns)
  }

  return exportRegisteredJSONSchemaForSchemaName({
    context,
    name: schemaName,
    mode: params.mode,
  })
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
    hasMetadataSchema(ownerDir)
  )
}

function findPropertiesPath(parts: string[]): { schemaName: string } | undefined {
  if (parts.length < 3 || parts[parts.length - 1] !== "Свойства.yaml") return undefined

  const objectDir = parts[parts.length - 3]
  if (!objectDir || !hasMetadataSchema(objectDir)) return undefined

  const schemaName = metadataSchemaNameByDir[objectDir]

  return { schemaName }
}

function hasMetadataSchema(dir: string): dir is keyof typeof metadataSchemaNameByDir {
  return Object.prototype.hasOwnProperty.call(metadataSchemaNameByDir, dir)
}
