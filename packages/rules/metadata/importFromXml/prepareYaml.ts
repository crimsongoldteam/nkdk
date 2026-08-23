import fs from "node:fs"
import { importContentFromXML } from "@nkdk/runtime"
import { withConfigurationIndexCollector } from "@nkdk/runtime"
import type { ConfigurationIndexCollector } from "@nkdk/runtime"
import type { ExternalFileEntry, XmlImportConfigurationContext } from "@nkdk/runtime"
import { importClientApplicationFormFromXMLToYAML } from "../forms/clientApplicationForm/fromXMLToYAML"
import { importBaseFormYaml } from "../forms/clientApplicationForm/baseFormYaml"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type { ClientApplicationFormXML, FormMetadataXML } from "../forms/clientApplicationForm/types"
import { importMetadataItemFromXMLToYAML } from "../ruleRuntime/metadataItem/fromXMLToYAML"
import {
  appendMetadataItemOwner,
  type MetadataItemOwnerContextEntry,
  withExportMetadataTargetOwners,
} from "../ruleRuntime/appliedObject/metadataItemOwnerContext"
import { metadataTargetOwnerFromRule } from "../ruleRuntime/property/metadataTargetString"
import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import type { DirectImportProfile, DirectImportResult } from "@nkdk/runtime/rule-kit"
import type { ImportedDependentPropertyCandidate } from "@nkdk/runtime/rule-kit"
import {
  createDeferredValuePathCollector,
  createImportedDependentPropertyCollector,
} from "@nkdk/runtime/rule-kit"
import { bindDeferredObjectValues, type DeferredObjectValue } from "@nkdk/runtime/rule-kit"
import { createLocalIndexesCollector, type LocalIndexes } from "../projectDefinition/localIndexes"
import { findRegisteredProjectRule } from "../projectDefinition/projectSpecRegistry"
import { getMetadataComponentDescriptor } from "../components/descriptor"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import type { ValidationProfiler } from "../validation/profile"
import type { ConfigurationIndexBlockFragment } from "@nkdk/runtime"
import { expandMetadataPathPattern } from "../resourceTopology/core/patterns"
import type { ImportAssignment, ImportXmlInput } from "./types"
import {
  normalizeImportedDependentItems,
  partitionImportedDependentItems,
} from "./dependentItems"
import { createImportedFormDataPathIndex } from "../forms/clientApplicationForm/formDataPathMetadata"

export interface PreparedImportYaml {
  assignment: ImportAssignment
  targetProjectPath: string
  yaml: unknown
  rule: MetadataItemRule
  ownerContext: readonly MetadataItemOwnerContextEntry[]
  localIndexes: LocalIndexes
  deferred: readonly DeferredObjectValue[]
  dependentDeferred: readonly ImportedDependentPropertyCandidate[]
  dependentOwner: { readonly dir: string; readonly name: string }
  generatedFiles: ExternalFileEntry[]
  baseFormCandidate?: PreparedBaseFormCandidate
}

export interface PreparedBaseFormCandidate {
  baseProjectPath: string
  targetProjectPath: string
  owner: { dir: string; name: string }
  yaml: unknown
  rule: MetadataItemRule
  localIndexes: LocalIndexes
  deferred: readonly DeferredObjectValue[]
  configurationFragment: ConfigurationIndexBlockFragment
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
  context: XmlImportConfigurationContext
  collector: ConfigurationIndexCollector
  profiler?: ValidationProfiler
  topology?: CompiledMetadataResourceTopology
}): Promise<PreparedImportYaml> {
  let xmlInputs: ParsedImportXmlInput[] | undefined
  try {
    xmlInputs = await readAndParseAssignmentXml(params.assignment.xmlFiles, params.profiler)
    const generatedFiles: ExternalFileEntry[] = []
    const rule = resolveAssignmentRule(
      params.assignment,
      params.context.fromXML.componentKind,
      params.topology,
    )
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
    ) as XmlImportConfigurationContext

    const importProfile = createDirectImportProfile()
    const dependentOwner = {
      dir: params.assignment.targetProjectPath.split("/", 1)[0] ?? "",
      name: params.assignment.owner?.name ?? params.assignment.itemName,
    }
    const result: DirectImportResult & Pick<PreparedImportYaml, "baseFormCandidate" | "dependentDeferred"> = measureYaml(params.profiler, () => {
      if (rule.itemType === ClientApplicationFormRules.itemType) {
        const metadataXML = requireMetadataXml(xmlInputs ?? [])
        const bodyInput = xmlInputs?.find(({ input }) => input.role === "body")
        const bodyXML = bodyInput?.parsed
        const imported = importClientApplicationFormFromXMLToYAML({
          context: importContext,
          formName: params.assignment.itemName,
          formXML: bodyXML?.["Form"] as ClientApplicationFormXML | undefined,
          metadataXML: metadataXML["MetaDataObject"] as FormMetadataXML,
          profile: importProfile,
          rule,
        })
        const baseFormXML = (bodyXML?.["Form"] as ClientApplicationFormXML | undefined)?.BaseForm
        const companion = baseFormXML === undefined
          ? undefined
          : resolveBaseFormCompanion(params.assignment, params.topology)
        if (baseFormXML === undefined || companion === undefined) {
          return { ...imported, dependentDeferred: [] }
        }
        const baseForm = importBaseFormYaml({
          context: importContext,
          baseFormXML,
          formName: params.assignment.itemName,
          rule: companion.rule,
        })
        return {
          ...imported,
          dependentDeferred: [],
          baseFormCandidate: {
            baseProjectPath: params.assignment.targetProjectPath,
            targetProjectPath: companion.targetProjectPath,
            owner: {
              dir: params.assignment.targetProjectPath.split("/", 1)[0] ?? "",
              name: params.assignment.owner?.name ?? params.assignment.itemName,
            },
            yaml: baseForm.yaml,
            rule: companion.rule,
            localIndexes: baseForm.localIndexes,
            deferred: bindDeferredObjectValues(baseForm.yaml, baseForm.deferred),
            configurationFragment: baseForm.configurationIndexCollector.fragment(companion.targetProjectPath),
          },
        }
      }

      const collector = createLocalIndexesCollector()
      const deferred = createDeferredValuePathCollector()
      const dependent = createImportedDependentPropertyCollector()
      const metadataXML = requireMetadataXml(xmlInputs ?? [])
      const yaml = importMetadataItemFromXMLToYAML({
        context: importContext,
        rule,
        name: params.assignment.itemName,
        xml: metadataXML["MetaDataObject"],
        traversal: {
          yamlPath: [],
          rulePath: [],
          collector,
          deferred,
          dependent,
          profile: importProfile,
        },
        propertyXML: mapPropertyXml(rule, xmlInputs ?? []),
      })
      if (yaml === undefined) throw new Error("XML-import не сформировал YAML")
      const partitioned = partitionImportedDependentItems({
        yaml,
        rule,
        candidates: dependent.finish(),
        owner: dependentOwner,
      })
      normalizeImportedDependentItems({
        yaml,
        rule,
        candidates: partitioned.immediate,
        collector: params.collector,
        owner: dependentOwner,
        preserveRawXML: false,
      })
      const localIndexes = collector.finish()
      const formDataPathIndex = createImportedFormDataPathIndex({ yaml, rule })
      if (formDataPathIndex !== undefined) localIndexes.metadata.formDataPathIndex = formDataPathIndex
      return {
        yaml,
        localIndexes,
        deferred: deferred.finish(),
        dependentDeferred: partitioned.deferred,
        generatedFiles,
      }
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
      deferred: bindDeferredObjectValues(result.yaml, result.deferred),
      dependentDeferred: result.dependentDeferred,
      dependentOwner,
      generatedFiles: [...generatedFiles, ...result.generatedFiles.filter((file) => !generatedFiles.includes(file))],
      ...(result.baseFormCandidate === undefined ? {} : { baseFormCandidate: result.baseFormCandidate }),
    }
  } finally {
    xmlInputs = undefined
  }
}

function resolveBaseFormCompanion(
  assignment: ImportAssignment,
  topology?: CompiledMetadataResourceTopology,
): {
  targetProjectPath: string
  rule: MetadataItemRule
} | undefined {
  const node = (topology ?? compileRegisteredMetadataResourceTopology()).assignments.find(
    ({ id }) => id === assignment.topologyAddress.nodeId
  )
  if (node === undefined) throw new Error(`Не найден узел топологии формы ${assignment.topologyAddress.nodeId}`)
  const companions = node.yamlCompanions.filter(({ projectRole }) => projectRole === "form")
  if (companions.length === 0) return undefined
  if (companions.length > 1) throw new Error(`У задания формы несколько YAML-спутников: ${assignment.targetProjectPath}`)
  const companion = companions[0]!
  return {
    targetProjectPath: expandMetadataPathPattern(companion.projectPattern, assignment.topologyAddress.values),
    rule: companion.itemRule,
  }
}

export function resolveAssignmentRule(
  assignment: ImportAssignment,
  componentKind: string,
  topology?: CompiledMetadataResourceTopology,
): MetadataItemRule {
  if (assignment.role === "configuration") return getMetadataComponentDescriptor(componentKind).rootRule
  const node =
    (topology ?? compileRegisteredMetadataResourceTopology()).assignments.find(
      ({ id }) => id === assignment.topologyAddress.nodeId
    )
  if (node === undefined) {
    throw new Error(
      `Не найден узел topology XML-import: ${assignment.topologyAddress.nodeId}`
    )
  }
  return node.itemRule
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
            () => importContentFromXML<Record<string, unknown>>(content, {
              preserveXsiNil: true,
              preserveEmptyElementNames: ["AdditionalFields"],
            })
          ) ?? importContentFromXML<Record<string, unknown>>(content, {
            preserveXsiNil: true,
            preserveEmptyElementNames: ["AdditionalFields"],
          }),
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
    planningMs: 0,
    xmlTraversalMs: 0,
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
  profiler.record(step, "XML в YAML: подготовка плана импорта", {
    items: profile.propertyCount,
    timeMs: profile.planningMs,
  })
  profiler.record(step, "XML в YAML: обход XML", { items: profile.propertyCount, timeMs: profile.xmlTraversalMs })
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
  const rule = findRegisteredProjectRule(itemType)
  registeredImportRulesByItemType.set(itemType, rule)
  return rule
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
