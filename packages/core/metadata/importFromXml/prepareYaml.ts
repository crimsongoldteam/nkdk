import fs from "node:fs"
import importContentFromXML from "../../xml/import/importer"
import { withConfigurationIndexCollector } from "../configurationIndex/collector/context"
import type { ConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import type { ConfigurationContextFromXML, ExternalFileEntry } from "../context/types"
import { importClientApplicationFormFromXMLToYAML } from "../forms/clientApplicationForm/fromXMLToYAML"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type { ClientApplicationFormXML, FormMetadataXML } from "../forms/clientApplicationForm/types"
import { importMetadataItemFromXMLToYAML } from "../orchestration/metadataItem/fromXMLToYAML"
import {
  appendMetadataItemOwner,
  type MetadataItemOwnerContextEntry,
  withExportMetadataTargetOwners,
} from "../orchestration/appliedObject/metadataItemOwnerContext"
import { metadataTargetOwnerFromRule } from "../orchestration/property/metadataTargetString"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "../orchestration/property/types"
import type { DirectImportProfile } from "../orchestration/property/importYamlTypes"
import { createLocalIndexesCollector, type LocalIndexes } from "../project/localIndexes"
import { configurationMetadataProjectSpec, metadataProjectSpecs } from "../project/specs"
import type { ValidationProfiler } from "../validation/profile"
import { registerOwnerFactCollectors } from "../validation/registerValidationMetadata"
import type { ImportAssignment, ImportXmlInput } from "./types"

registerOwnerFactCollectors()

export interface PreparedImportYaml {
  assignment: ImportAssignment
  targetProjectPath: string
  yaml: unknown
  rule: MetadataItemRule
  ownerContext: readonly MetadataItemOwnerContextEntry[]
  localIndexes: LocalIndexes
  generatedFiles: ExternalFileEntry[]
}

interface ParsedImportXmlInput {
  input: ImportXmlInput
  parsed: Record<string, unknown>
}

let registeredImportRuleLookupCountValueForTests = 0
const registeredImportRulesByItemType = new Map<string, MetadataItemRule | undefined>()

export function registeredImportRuleLookupCountForTests(): number {
  return registeredImportRuleLookupCountValueForTests
}

export function resetRegisteredImportRuleLookupCountForTests(): void {
  registeredImportRuleLookupCountValueForTests = 0
  registeredImportRulesByItemType.clear()
}

export async function prepareImportYaml(params: {
  assignment: ImportAssignment
  context: ConfigurationContextFromXML
  collector: ConfigurationIndexCollector
  profiler?: ValidationProfiler
}): Promise<PreparedImportYaml> {
  let xmlInputs: ParsedImportXmlInput[] | undefined
  try {
    xmlInputs = await readAndParseAssignmentXml(params.assignment.xmlFiles, params.profiler)
    const generatedFiles: ExternalFileEntry[] = []
    const rule = resolveAssignmentRule(params.assignment)
    const ownerContext = buildOwnerContext(params.assignment, rule)
    const collectedContext = withConfigurationIndexCollector(
      params.context,
      params.collector,
      params.assignment.logicalAddress
    )
    const importContext = withExportMetadataTargetOwners(
      {
        ...collectedContext,
        exportToYAML: {
          ...(collectedContext.exportToYAML ?? { toTyped: false }),
          externalFilesCollector: generatedFiles,
          parent: { name: params.assignment.itemName },
        },
      },
      ownerContext
    ) as ConfigurationContextFromXML

    const importProfile = createDirectImportProfile()
    const result = measureYaml(params.profiler, () => {
      if (rule === ClientApplicationFormRules) {
        const metadataXML = requireMetadataXml(xmlInputs ?? [])
        const bodyXML = xmlInputs?.find(({ input }) => input.role === "body")?.parsed
        return importClientApplicationFormFromXMLToYAML({
          context: importContext,
          formName: params.assignment.itemName,
          formXML: bodyXML?.["Form"] as ClientApplicationFormXML | undefined,
          metadataXML: metadataXML["MetaDataObject"] as FormMetadataXML,
          profile: importProfile,
        })
      }

      const collector = createLocalIndexesCollector()
      const metadataXML = requireMetadataXml(xmlInputs ?? [])
      const yaml = importMetadataItemFromXMLToYAML({
        context: importContext,
        rule,
        name: params.assignment.itemName,
        xml: metadataXML["MetaDataObject"],
        traversal: { yamlPath: [], rulePath: [], collector, profile: importProfile },
        propertyXML: mapPropertyXml(rule, xmlInputs ?? []),
      })
      if (yaml === undefined) throw new Error("XML-import не сформировал YAML")
      return { yaml, localIndexes: collector.finish(), generatedFiles }
    })
    recordDirectImportProfile(params.profiler, importProfile)

    params.profiler?.record("Подготовка импорта конфигурации", "Сбор локальных индексов", {
      items: result.localIndexes.metadata.events.length,
      timeMs: 0,
    })
    return {
      assignment: params.assignment,
      targetProjectPath: params.assignment.targetProjectPath,
      yaml: result.yaml,
      rule,
      ownerContext,
      localIndexes: result.localIndexes,
      generatedFiles: [...generatedFiles, ...result.generatedFiles.filter((file) => !generatedFiles.includes(file))],
    }
  } finally {
    xmlInputs = undefined
  }
}

function resolveAssignmentRule(assignment: ImportAssignment): MetadataItemRule {
  if (assignment.role === "configuration") return configurationMetadataProjectSpec.rule
  const rule = findRegisteredImportRule(assignment.itemType)
  if (rule !== undefined) return rule
  if (assignment.role === "fileItem" && assignment.targetProjectPath.endsWith(".yaml"))
    return ClientApplicationFormRules
  throw new Error(`Не найдено правило подготовки XML-import для ${assignment.itemType}`)
}

function buildOwnerContext(
  assignment: ImportAssignment,
  rule: MetadataItemRule
): readonly MetadataItemOwnerContextEntry[] {
  const owner = assignment.owner
  if (owner !== undefined) {
    const ownerRule = findRegisteredImportRule(owner.itemType)
    const targetOwner =
      ownerRule === undefined ? undefined : metadataTargetOwnerFromRule({ itemRule: ownerRule, name: owner.name })
    return appendMetadataItemOwner([], owner.itemType as never, owner.name, "", targetOwner)
  }
  const targetOwner = metadataTargetOwnerFromRule({ itemRule: rule, name: assignment.itemName })
  return appendMetadataItemOwner([], rule.itemType, assignment.itemName, "", targetOwner)
}

async function readAndParseAssignmentXml(
  xmlFiles: readonly ImportXmlInput[],
  profiler: ValidationProfiler | undefined
): Promise<ParsedImportXmlInput[]> {
  const result: ParsedImportXmlInput[] = []
  for (const input of xmlFiles) {
    try {
      const content =
        (await profiler?.measureAsync("Подготовка импорта конфигурации", "Чтение XML", { items: 1 }, () =>
          fs.promises.readFile(input.sourcePath, "utf-8")
        )) ?? (await fs.promises.readFile(input.sourcePath, "utf-8"))
      result.push({
        input,
        parsed:
          profiler?.measure(
            "Подготовка импорта конфигурации",
            "Парсинг XML",
            { items: 1, bytes: Buffer.byteLength(content) },
            () => importContentFromXML<Record<string, unknown>>(content, { preserveXsiNil: true })
          ) ?? importContentFromXML<Record<string, unknown>>(content, { preserveXsiNil: true }),
      })
    } catch (caught) {
      throw new ImportXmlInputError(input.sourcePath, caught)
    }
  }
  return result
}

function measureYaml<T>(profiler: ValidationProfiler | undefined, fn: () => T): T {
  if (profiler === undefined) return fn()
  return profiler.measure("Подготовка импорта конфигурации", "Преобразование XML в YAML", { items: 1 }, fn)
}

function createDirectImportProfile(): DirectImportProfile {
  return {
    propertyCount: 0,
    directCount: 0,
    legacyCount: 0,
    exportedCount: 0,
    orderingMs: 0,
    selectionMs: 0,
    configurationIndexMs: 0,
    directInclusiveMs: 0,
    legacyFromXmlMs: 0,
    yamlExportMs: 0,
    defaultMs: 0,
    outputMs: 0,
    collectorMs: 0,
    directByType: new Map(),
    legacyByType: new Map(),
  }
}

function recordDirectImportProfile(profiler: ValidationProfiler | undefined, profile: DirectImportProfile): void {
  if (profiler === undefined) return
  const step = "Подготовка импорта конфигурации"
  profiler.record(step, "XML в YAML: определение порядка свойств", {
    items: profile.propertyCount,
    timeMs: profile.orderingMs,
  })
  profiler.record(step, "XML в YAML: выбор свойств", { items: profile.propertyCount, timeMs: profile.selectionMs })
  profiler.record(step, "XML в YAML: сбор данных индекса конфигурации", {
    items: profile.propertyCount,
    timeMs: profile.configurationIndexMs,
  })
  profiler.record(step, "XML в YAML: прямые преобразователи", {
    items: profile.directCount,
    timeMs: profile.directInclusiveMs,
  })
  profiler.record(step, "XML в YAML: fromXML атомарных свойств", {
    items: profile.legacyCount,
    timeMs: profile.legacyFromXmlMs,
  })
  profiler.record(step, "XML в YAML: toYAML атомарных свойств", {
    items: profile.legacyCount,
    timeMs: profile.yamlExportMs,
  })
  profiler.record(step, "XML в YAML: значения по умолчанию", {
    items: profile.propertyCount,
    timeMs: profile.defaultMs,
  })
  profiler.record(step, "XML в YAML: запись значений в YAML", {
    items: profile.exportedCount,
    timeMs: profile.outputMs,
  })
  profiler.record(step, "XML в YAML: сбор локальных фактов", {
    items: profile.exportedCount,
    timeMs: profile.collectorMs,
  })
  recordProfileBuckets(profiler, "XML в YAML: прямой тип", profile.directByType)
  recordProfileBuckets(profiler, "XML в YAML: атомарный тип", profile.legacyByType)
}

function recordProfileBuckets(
  profiler: ValidationProfiler,
  prefix: string,
  buckets: ReadonlyMap<string, { count: number; timeMs: number }>
): void {
  for (const [type, bucket] of buckets) {
    profiler.record("Подготовка импорта конфигурации", `${prefix} ${type}`, {
      items: bucket.count,
      timeMs: bucket.timeMs,
    })
  }
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
  if (registeredImportRulesByItemType.has(itemType)) return registeredImportRulesByItemType.get(itemType)
  registeredImportRuleLookupCountValueForTests += 1
  for (const spec of [configurationMetadataProjectSpec, ...metadataProjectSpecs]) {
    const result = findRule(spec.rule, itemType, new Set())
    if (result !== undefined) {
      registeredImportRulesByItemType.set(itemType, result)
      return result
    }
  }
  registeredImportRulesByItemType.set(itemType, undefined)
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
