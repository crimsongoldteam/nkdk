import fs from "node:fs"
import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlCompatibilityWithRootStructures,
  parseXmlDocumentWithSaxes,
  type XmlAnomalyAnnotationTable,
  type XmlAnomalyAnnotations,
  type XmlDocument,
  type XmlElementNode,
  type XmlRootStructure,
} from "@nkdk/runtime"
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
  collectImportedDependentXmlValues,
  partitionImportedDependentItems,
} from "./dependentItems"
import { createImportedFormDataPathIndex } from "../forms/clientApplicationForm/formDataPathMetadata"
import {
  captureXmlAnomalyProofAudit,
  deriveXmlAnomalyProofPlan,
  type XmlAnomalyProofBoundary,
  type XmlAnomalyProofAudit,
} from "./anomalyProof"

export interface PreparedImportYaml {
  assignment: ImportAssignment
  targetProjectPath: string
  yaml: unknown
  annotations: XmlAnomalyAnnotationTable
  proofAudit: XmlAnomalyProofAudit
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
  annotations: XmlAnomalyAnnotations
  rule: MetadataItemRule
  localIndexes: LocalIndexes
  deferred: readonly DeferredObjectValue[]
  configurationFragment: ConfigurationIndexBlockFragment
}

interface ParsedImportXmlInput {
  input: ImportXmlInput
  parsed: Record<string, unknown>
  roots: readonly XmlRootStructure[]
  document?: XmlDocument
}

let registeredImportRuleLookupCountValueForTests = 0
let importAuditOutcomeCountValueForTests = 0
let rootProofParsePassCountValueForTests = 0
const registeredImportRulesByItemType = new Map<string, MetadataItemRule | undefined>()

export function importAuditOutcomeCountForTests(): number {
  return importAuditOutcomeCountValueForTests
}

export function resetImportAuditOutcomeCountForTests(): void {
  importAuditOutcomeCountValueForTests = 0
}

export function rootProofParsePassCountForTests(): number {
  return rootProofParsePassCountValueForTests
}

export function resetRootProofParsePassCountForTests(): void {
  rootProofParsePassCountValueForTests = 0
}

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
  proofDetail?: "full" | "roots"
}): Promise<PreparedImportYaml> {
  let xmlInputs: ParsedImportXmlInput[] | undefined
  try {
    xmlInputs = await readAndParseAssignmentXml(
      params.assignment.xmlFiles,
      params.profiler,
      params.proofDetail ?? "full",
    )
    const annotations = createXmlAnomalyAnnotations()
    const audit = params.proofDetail === "roots"
      ? undefined
      : createXmlImportAuditSession(xmlInputs.flatMap(({ document }) => document?.roots ?? []))
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
        const metadataXMLNode = requireMetadataXmlNode(xmlInputs ?? [])
        const bodyInput = xmlInputs?.find(({ input }) => input.role === "body")
        const bodyXML = bodyInput?.parsed
        const formXMLNode = bodyInput?.document?.roots.find(({ name }) => name === "Form")
        const imported = importClientApplicationFormFromXMLToYAML({
          context: importContext,
          formName: params.assignment.itemName,
          formXML: bodyXML?.["Form"] as ClientApplicationFormXML | undefined,
          metadataXML: metadataXML["MetaDataObject"] as FormMetadataXML,
          formXMLNode,
          metadataXMLNode,
          audit,
          annotations,
          profile: importProfile,
          rule,
        })
        const baseFormCandidate = importAssignmentBaseFormCandidate({
          assignment: params.assignment,
          topology: params.topology,
          inputs: xmlInputs ?? [],
          context: importContext,
        })
        return {
          ...imported,
          dependentDeferred: [],
          ...(baseFormCandidate === undefined ? {} : { baseFormCandidate }),
        }
      }

      const collector = createLocalIndexesCollector()
      const deferred = createDeferredValuePathCollector()
      const dependent = createImportedDependentPropertyCollector()
      const metadataXML = requireMetadataXml(xmlInputs ?? [])
      const metadataNode = requireMetadataXmlNode(xmlInputs ?? [])
      const externalPropertyXml = mapExternalPropertyXmlInputs(rule, xmlInputs ?? [])
      const yaml = importMetadataItemFromXMLToYAML({
        context: importContext,
        rule,
        name: params.assignment.itemName,
        xml: metadataNode ?? metadataXML["MetaDataObject"],
        traversal: {
          yamlPath: [],
          rulePath: [],
          collector,
          deferred,
          dependent,
          ...(audit === undefined ? {} : { audit }),
          annotations,
          ...(metadataNode === undefined ? {} : { xmlNodes: [metadataNode] }),
          profile: importProfile,
        },
        propertyXML: externalPropertyXml.compatibilityByPropertyKey,
        propertyXMLNodes: externalPropertyXml.nodesByPropertyKey,
      })
      if (yaml === undefined) throw new Error("XML-import не сформировал YAML")
      const dependentCandidates = dependent.finish()
      collectImportedDependentXmlValues(dependentCandidates, params.collector)
      const partitioned = partitionImportedDependentItems({
        yaml,
        rule,
        candidates: dependentCandidates,
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
      const baseFormCandidate = importAssignmentBaseFormCandidate({
        assignment: params.assignment,
        topology: params.topology,
        inputs: xmlInputs ?? [],
        context: importContext,
      })
      return {
        yaml,
        localIndexes,
        deferred: deferred.finish(),
        dependentDeferred: partitioned.deferred,
        generatedFiles,
        ...(baseFormCandidate === undefined ? {} : { baseFormCandidate }),
      }
    })
    recordDirectImportProfile(params.profiler, importProfile)
    audit?.finalize()
    if (audit !== undefined) importAuditOutcomeCountValueForTests += audit.outcomes().length
    const proofAudit = params.proofDetail === "roots"
      ? {
          sources: xmlInputs.map(({ input, roots }) => ({
            sourcePath: input.sourcePath,
            role: input.role,
            roots: roots.map(({ path, name, structuralHash, span }) => ({
              xmlPath: path,
              elementName: name,
              structuralHash,
              span: { ...span },
            })),
          })),
          boundaries: [],
          itemAnchors: [],
        }
      : (() => {
          if (audit === undefined) throw new Error("Подробный XML proof требует import audit")
          const proofSources = xmlInputs.map(({ input, document }) => {
            if (document === undefined) throw new Error("Подробный XML proof требует адресное XML-дерево")
            return { sourcePath: input.sourcePath, role: input.role, document }
          })
          const proofPlan = deriveXmlAnomalyProofPlan({
            sources: proofSources,
            audit,
            rule,
            data: result.yaml,
            includePlannedAbsences: false,
          })
          const fallbackBoundaries = externalPropertyRootBoundaries(
            proofPlan.boundaries,
            rule,
            xmlInputs,
          )
          return captureXmlAnomalyProofAudit({
            sources: proofSources,
            boundaries: proofPlan.boundaries,
            fallbackBoundaries,
            itemAnchors: proofPlan.itemAnchors,
          })
        })()

    params.profiler?.record("Подготовка импорта конфигурации", "Сбор локальных индексов", {
      items: result.localIndexes.metadata.events.length,
      timeMs: 0,
    })
    return {
      assignment: params.assignment,
      targetProjectPath: params.assignment.targetProjectPath,
      yaml: result.yaml,
      annotations,
      proofAudit,
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

function importAssignmentBaseFormCandidate(params: {
  readonly assignment: ImportAssignment
  readonly topology?: CompiledMetadataResourceTopology
  readonly inputs: readonly ParsedImportXmlInput[]
  readonly context: XmlImportConfigurationContext
}): PreparedBaseFormCandidate | undefined {
  const bodyXML = params.inputs.find(({ input }) => input.role === "body")?.parsed
  const baseFormXML = (bodyXML?.["Form"] as ClientApplicationFormXML | undefined)?.BaseForm
  if (baseFormXML === undefined) return undefined
  const companion = resolveBaseFormCompanion(params.assignment, params.topology)
  if (companion === undefined) return undefined
  const baseForm = importBaseFormYaml({
    context: params.context,
    baseFormXML,
    formName: params.assignment.itemName,
    rule: companion.rule,
  })
  return {
    baseProjectPath: params.assignment.targetProjectPath,
    targetProjectPath: companion.targetProjectPath,
    owner: {
      dir: params.assignment.targetProjectPath.split("/", 1)[0] ?? "",
      name: params.assignment.owner?.name ?? params.assignment.itemName,
    },
    yaml: baseForm.yaml,
    annotations: baseForm.annotations,
    rule: companion.rule,
    localIndexes: baseForm.localIndexes,
    deferred: bindDeferredObjectValues(baseForm.yaml, baseForm.deferred),
    configurationFragment: baseForm.configurationIndexCollector.fragment(companion.targetProjectPath),
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
  profiler: ValidationProfiler | undefined,
  proofDetail: "full" | "roots",
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
        ...(() => {
          return profiler?.measure(
            "Подготовка импорта конфигурации",
            "Парсинг XML",
            { items: 1, bytes: Buffer.byteLength(content) },
            () => parseAssignmentXml(content, proofDetail),
          ) ?? parseAssignmentXml(content, proofDetail)
        })(),
      })
    } catch (caught) {
      throw new ImportXmlInputError(input.sourcePath, caught)
    }
  }
  return result
}

function parseAssignmentXml(
  content: string,
  proofDetail: "full" | "roots",
): Omit<ParsedImportXmlInput, "input"> {
  if (proofDetail === "full") {
    const document = parseXmlDocumentWithSaxes(content, {
      preserveXsiNil: true,
      preserveEmptyElementNames: ["AdditionalFields"],
    })
    return { document, roots: document.roots, parsed: document.compatibility }
  }
  rootProofParsePassCountValueForTests += 1
  const parsed = parseXmlCompatibilityWithRootStructures(content, {
    preserveXsiNil: true,
    preserveEmptyElementNames: ["AdditionalFields"],
  })
  return { parsed: parsed.compatibility, roots: parsed.roots }
}

function requireMetadataXmlNode(inputs: readonly ParsedImportXmlInput[]) {
  const metadata = inputs.find(({ input }) => input.role === "metadata")
  return metadata?.document?.roots.find(({ name }) => name === "MetaDataObject")
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

function mapExternalPropertyXmlInputs(
  rule: MetadataItemRule,
  inputs: readonly ParsedImportXmlInput[],
): {
  readonly compatibilityByPropertyKey: ReadonlyMap<string, unknown>
  readonly nodesByPropertyKey: ReadonlyMap<string, readonly XmlElementNode[]>
} {
  const compatibilityByPropertyKey = new Map<string, unknown>()
  const nodesByPropertyKey = new Map<string, readonly XmlElementNode[]>()
  for (const [key, propertyRule] of Object.entries(rule.properties) as Array<[string, PropertyRule]>) {
    if (propertyRule.filePath === undefined) continue
    const normalizedFilePath = propertyRule.filePath.replace(/\\/g, "/")
    const input = inputs.find(({ input }) => normalizedPath(input.sourcePath).endsWith(`/${normalizedFilePath}`))
    if (input === undefined) continue
    compatibilityByPropertyKey.set(key, input.parsed)
    if (input.document !== undefined) nodesByPropertyKey.set(key, input.document.roots)
  }
  return { compatibilityByPropertyKey, nodesByPropertyKey }
}

function externalPropertyRootBoundaries(
  boundaries: readonly XmlAnomalyProofBoundary[],
  rule: MetadataItemRule,
  inputs: readonly ParsedImportXmlInput[],
): XmlAnomalyProofBoundary[] {
  const result: XmlAnomalyProofBoundary[] = []
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties) as Array<[string, PropertyRule]>) {
    if (propertyRule.filePath === undefined || typeof propertyRule.yaml !== "string") continue
    const normalizedFilePath = propertyRule.filePath.replaceAll("\\", "/")
    const input = inputs.find(({ input }) => normalizedPath(input.sourcePath).endsWith(`/${normalizedFilePath}`))
    if (input === undefined) continue
    if (boundaries.some((boundary) =>
      boundary.sourcePath === input.input.sourcePath
      && boundary.yamlPath.length === 1
      && boundary.yamlPath[0] === propertyRule.yaml
    )) continue
    const document = input.document
    if (document === undefined) throw new Error("Внешнее XML-свойство требует адресное XML-дерево")
    if (document.roots.length !== 1) {
      throw new Error(`Внешнее XML-свойство ${propertyKey} должно содержать один корень`)
    }
    const root = document.roots[0]!
    result.push({
      sourcePath: input.input.sourcePath,
      sourceRole: input.input.role,
      xmlPath: root.path,
      yamlPath: [propertyRule.yaml],
      rulePath: [propertyKey],
      presentInSource: true,
      targetPaths: [root.path],
    })
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
