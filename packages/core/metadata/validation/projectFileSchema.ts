import type { TSchema } from "@sinclair/typebox"
import { isAbsolute, relative, resolve, sep } from "path"
import { MetadataAccumulationRegisterRules } from "~/metadata/appliedObjects/metadataAccumulationRegister/rules"
import { exportMetadataCatalogToJSONSchema } from "~/metadata/appliedObjects/metadataCatalog/toJSONSchema"
import { MetadataDataProcessorRules } from "~/metadata/appliedObjects/metadataDataProcessor/rules"
import { exportMetadataDocumentToJSONSchema } from "~/metadata/appliedObjects/metadataDocument/toJSONSchema"
import { MetadataDocumentJournalRules } from "~/metadata/appliedObjects/metadataDocumentJournal/rules"
import { exportMetadataEnumerationToJSONSchema } from "~/metadata/appliedObjects/metadataEnumeration/toJSONSchema"
import { MetadataExchangePlanRules } from "~/metadata/appliedObjects/metadataExchangePlan/rules"
import { MetadataHTTPServiceRules } from "~/metadata/appliedObjects/metadataHTTPService/rules"
import { MetadataInformationRegisterRules } from "~/metadata/appliedObjects/metadataInformationRegister/rules"
import type { ConfigurationContext } from "~/metadata/context/types"
import { createEmptyClientApplicationForm } from "~/metadata/forms/clientApplicationForm/createEmpty"
import { exportClientApplicationFormToJSONSchema } from "~/metadata/forms/clientApplicationForm/toJSONSchema"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"

export interface ExportJSONSchemaForProjectFileParams {
  context: ConfigurationContext
  filePath: string
  projectDir?: string
}

export class ProjectFileSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProjectFileSchemaError"
  }
}

const expectedPatterns =
  "Ожидались пути вида <Вид>/<Имя>/Свойства.yaml или <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"

const metadataSchemaByDir = {
  Справочник: (context: ConfigurationContext) => exportMetadataCatalogToJSONSchema({ context }),
  Документ: (context: ConfigurationContext) => exportMetadataDocumentToJSONSchema({ context }),
  Перечисление: (context: ConfigurationContext) => exportMetadataEnumerationToJSONSchema({ context }),
  Обработка: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataDataProcessorRules }),
  ЖурналДокументов: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataDocumentJournalRules }),
  HTTPСервис: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataHTTPServiceRules }),
  РегистрСведений: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataInformationRegisterRules }),
  РегистрНакопления: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataAccumulationRegisterRules }),
  ПланОбмена: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataExchangePlanRules }),
} satisfies Record<string, (context: ConfigurationContext) => TSchema>

export function exportJSONSchemaForProjectFile(params: ExportJSONSchemaForProjectFileParams): TSchema {
  const { context } = params
  const normalized = normalizeProjectPath(params)
  const parts = normalized.split("/")

  if (!normalized.toLowerCase().endsWith(".yaml")) {
    throw new ProjectFileSchemaError("JSON Schema поддерживается только для .yaml файлов")
  }

  if (isFormPath(parts)) {
    return exportClientApplicationFormToJSONSchema({
      context,
      value: createEmptyClientApplicationForm(),
    })
  }

  const propertiesMatch = findPropertiesPath(parts)
  if (propertiesMatch) {
    return propertiesMatch.exportSchema(context)
  }

  throw new ProjectFileSchemaError(expectedPatterns)
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

function findPropertiesPath(parts: string[]): { exportSchema: (context: ConfigurationContext) => TSchema } | undefined {
  if (parts.length < 3 || parts[parts.length - 1] !== "Свойства.yaml") return undefined

  const objectDir = parts[parts.length - 3]
  if (!objectDir || !hasMetadataSchema(objectDir)) return undefined

  const exportSchema = metadataSchemaByDir[objectDir]

  return { exportSchema }
}

function hasMetadataSchema(dir: string): dir is keyof typeof metadataSchemaByDir {
  return Object.prototype.hasOwnProperty.call(metadataSchemaByDir, dir)
}
