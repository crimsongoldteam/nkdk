import fs from "node:fs"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { prepareConfigurationModelFromXML } from "../appliedObjects/configuration/rootIO"
import { withConfigurationIndexCollector } from "../configurationIndex/collector/context"
import type { ConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import type { ConfigurationContextFromXML, ExternalFileEntry } from "../context/types"
import { prepareClientApplicationFormModelFromXML } from "../forms/clientApplicationForm/convertFromXML"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type {
  ClientApplicationForm,
  ClientApplicationFormXML,
  FormMetadataXML,
} from "../forms/clientApplicationForm/types"
import { prepareAppliedObjectModelFromXML } from "../orchestration/appliedObject/convertFromXML"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import type { MetadataItem, MetadataItemRule, PropertyRule } from "../orchestration/property/types"
import { configurationMetadataProjectSpec, metadataProjectSpecs } from "../project/specs"
import { buildFormDataPathIndex, type FormDataPathIndex } from "../validation/dataPath/formIndex"
import importContentFromXML from "../../xml/import/importer"
import type { ImportAssignment, ImportXmlInput } from "./types"

export interface PreparedImportModel {
  assignment: ImportAssignment
  targetProjectPath: string
  model: MetadataItem
  rule: MetadataItemRule
  localDataPathIndex?: FormDataPathIndex
  generatedFiles: ExternalFileEntry[]
}

interface ParsedImportXmlInput {
  input: ImportXmlInput
  parsed: Record<string, unknown>
}

export async function prepareImportModel(params: {
  assignment: ImportAssignment
  context: ConfigurationContextFromXML
  collector: ConfigurationIndexCollector
}): Promise<PreparedImportModel> {
  let xmlInputs: ParsedImportXmlInput[] | undefined
  try {
    xmlInputs = await readAndParseAssignmentXml(params.assignment.xmlFiles)
    const context = withConfigurationIndexCollector(params.context, params.collector, params.assignment.logicalAddress)
    const registeredRule = findRegisteredImportRule(params.assignment.itemType)

    if (params.assignment.role === "configuration") {
      const metadataXML = requireMetadataXml(xmlInputs)
      const model = prepareConfigurationModelFromXML({
        context,
        metadataXML: metadataXML["MetaDataObject"],
        propertyXML: mapPropertyXml(configurationMetadataProjectSpec.rule, xmlInputs),
      })
      return preparedResult(params.assignment, requireModel(model), configurationMetadataProjectSpec.rule)
    }

    if (registeredRule !== undefined) {
      const metadataXML = requireMetadataXml(xmlInputs)
      const model = prepareAppliedObjectModelFromXML({
        context,
        rule: registeredRule,
        name: params.assignment.itemName,
        metadataXML: metadataXML["MetaDataObject"],
        propertyXML: mapPropertyXml(registeredRule, xmlInputs),
      })
      return preparedResult(params.assignment, requireModel(model), registeredRule)
    }

    const bodyXML = xmlInputs.find(({ input }) => input.role === "body")?.parsed
    if (params.assignment.role === "fileItem" && params.assignment.targetProjectPath.endsWith(".yaml")) {
      const metadataXML = requireMetadataXml(xmlInputs)
      const model = prepareClientApplicationFormModelFromXML({
        context,
        formName: params.assignment.itemName,
        formXML: bodyXML?.["Form"] as ClientApplicationFormXML | undefined,
        metadataXML: metadataXML["MetaDataObject"] as FormMetadataXML,
      })
      return preparedResult(params.assignment, model, ClientApplicationFormRules, {
        localDataPathIndex: buildLocalFormDataPathIndex(params.assignment.targetProjectPath, model),
      })
    }

    throw new Error(`Не найдено правило подготовки XML-import для ${params.assignment.itemType}`)
  } finally {
    xmlInputs = undefined
  }
}

function preparedResult(
  assignment: ImportAssignment,
  model: MetadataItem,
  rule: MetadataItemRule,
  extra: Pick<PreparedImportModel, "localDataPathIndex"> = {}
): PreparedImportModel {
  return {
    assignment,
    targetProjectPath: assignment.targetProjectPath,
    model,
    rule,
    ...extra,
    generatedFiles: [],
  }
}

async function readAndParseAssignmentXml(xmlFiles: readonly ImportXmlInput[]): Promise<ParsedImportXmlInput[]> {
  const result: ParsedImportXmlInput[] = []
  for (const input of xmlFiles) {
    try {
      const content = await fs.promises.readFile(input.sourcePath, "utf-8")
      result.push({
        input,
        parsed: importContentFromXML<Record<string, unknown>>(content, { preserveXsiNil: true }),
      })
    } catch (caught) {
      throw new ImportXmlInputError(input.sourcePath, caught)
    }
  }
  return result
}

function requireMetadataXml(inputs: readonly ParsedImportXmlInput[]): Record<string, unknown> {
  const metadata = inputs.find(({ input }) => input.role === "metadata")
  if (metadata === undefined) throw new Error("В задании XML-import отсутствует metadata XML")
  return metadata.parsed
}

function mapPropertyXml(rule: MetadataItemRule, inputs: readonly ParsedImportXmlInput[]): ReadonlyMap<string, unknown> {
  const result = new Map<string, unknown>()
  for (const [key, propertyRule] of Object.entries(rule.properties) as Array<[string, PropertyRule]>) {
    if (propertyRule.filePath === undefined) continue
    const normalizedFilePath = propertyRule.filePath.replace(/\\/g, "/")
    const input = inputs.find(({ input }) => normalizedPath(input.sourcePath).endsWith(`/${normalizedFilePath}`))
    if (input !== undefined) result.set(key, input.parsed)
  }
  return result
}

function normalizedPath(path: string): string {
  return path.replace(/\\/g, "/")
}

function findRegisteredImportRule(itemType: string): MetadataItemRule | undefined {
  for (const spec of [configurationMetadataProjectSpec, ...metadataProjectSpecs]) {
    const result = findRule(spec.rule, itemType, new Set())
    if (result !== undefined) return result
  }
  return undefined
}

function findRule(rule: MetadataItemRule, itemType: string, seen: Set<MetadataItemRule>): MetadataItemRule | undefined {
  if (seen.has(rule)) return undefined
  seen.add(rule)
  if (rule.itemType === itemType) return rule

  for (const child of rule.childCollections ?? []) {
    for (const candidate of [child.fileItemRule, child.itemRule]) {
      if (candidate === undefined) continue
      const result = findRule(candidate, itemType, seen)
      if (result !== undefined) return result
    }
  }
  for (const propertyRule of Object.values(rule.properties)) {
    const itemRule = getTypeRule(propertyRule.type, "collectionItemRule")?.itemRule
    if (itemRule === undefined) continue
    const result = findRule(itemRule, itemType, seen)
    if (result !== undefined) return result
  }
  return undefined
}

function buildLocalFormDataPathIndex(filePath: string, form: ClientApplicationForm): FormDataPathIndex {
  return buildFormDataPathIndex({ filePath, parsed: parseMetadataYaml(""), form })
}

function requireModel(model: MetadataItem | undefined): MetadataItem {
  if (model === undefined) throw new Error("XML-import не сформировал metadata-модель")
  return model
}

export class ImportXmlInputError extends Error {
  readonly sourcePath: string

  constructor(sourcePath: string, cause: unknown) {
    super(`Не удалось прочитать или разобрать XML-файл ${sourcePath}: ${errorMessage(cause)}`, { cause })
    this.name = "ImportXmlInputError"
    this.sourcePath = sourcePath
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
