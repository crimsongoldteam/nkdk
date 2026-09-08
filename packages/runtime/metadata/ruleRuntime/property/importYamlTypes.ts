import type { ConfigurationContext, ConfigurationContextFromXML, ExternalFileEntry } from "../../context/types"
import type { FormDataPathIndex } from "../dataPath/formIndex"
import type { YamlPath } from "../../diagnostics/types"
import type {
  DeferredRulePathSegment,
  LocalIndexes,
  LocalIndexesCollector,
  LocalMetadataFactsWriter,
  LocalYamlFact,
} from "./localFacts"
import type { MetadataItemRule, PropertyRule } from "./types"
import type { DeferredValuePath } from "./deferredObjectValues"
import type { XmlElementNode } from "../../../xml/import/document"
import type { XmlImportAuditSession, XmlImportAuditedNode } from "../xmlAnomaly/importAudit"
import type { XmlAnomalyAnnotationTable } from "../../../yaml/xmlAnomalyAnnotations"
import type { YAMLScalarTag } from "../../../yaml/scalarTags"
import type { ExecutionPath } from "./executionPath"
import {
  arrayLengthXmlImportAttemptAdapter,
  attachXmlImportAttemptAdapter,
} from "../xmlAnomaly/attempt"

export type { DeferredValuePath } from "./deferredObjectValues"

export type DirectImportMode = "yaml" | "facts"

export interface DirectImportPropertyFact {
  readonly itemType: string
  readonly itemRule?: MetadataItemRule
  readonly propertyKey: string
  readonly yamlPath: YamlPath
  /** Адрес во время XML-обхода, до именования элементов коллекций. */
  readonly sourceYamlPath?: YamlPath
  readonly value: unknown
  /** Значение уже прошло формирование YAML-проекции, а не только XML-преобразование. */
  readonly exportedToYAML?: true
  readonly scalarTag?: YAMLScalarTag
  /** Было ли свойство физически представлено в исходном XML. */
  readonly presentInXML?: boolean
  /** Исходное смысловое XML-значение для локальной проверки опущенного default. */
  readonly reconstructionValue?: unknown
}

export interface DirectImportFactsSink {
  acceptProperty(fact: DirectImportPropertyFact): void
}

export function createDirectImportFactsCollector(select?: (fact: DirectImportPropertyFact) => boolean): DirectImportFactsSink & {
  finish(): readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
} {
  const facts: Parameters<DirectImportFactsSink["acceptProperty"]>[0][] = []
  const collector = {
    acceptProperty(fact: Parameters<DirectImportFactsSink["acceptProperty"]>[0]) {
      if (select !== undefined && !select(fact)) return
      const yamlPath = [...fact.yamlPath]
      const source = fact.sourceYamlPath
      const sourceYamlPath = source === undefined
        || (source.length === yamlPath.length && source.every((segment, index) => segment === yamlPath[index]))
        ? yamlPath
        : [...source]
      facts.push({ ...fact, yamlPath, sourceYamlPath })
    },
    finish: () => facts,
  }
  attachXmlImportAttemptAdapter(collector, arrayLengthXmlImportAttemptAdapter([facts]))
  return collector
}

export interface DirectImportTraversal<Execution = unknown> {
  mode?: DirectImportMode
  facts?: DirectImportFactsSink
  produceResult?: boolean
  execution?: Execution
  pathCursor: ExecutionPath<string | number>
  rulePath: readonly DeferredRulePathSegment[]
  collector: LocalIndexesCollector
  deferred?: DeferredValuePathCollector
  dependent?: ImportedDependentPropertyCollector
  dependencies?: PreparedImportDependencies
  roundTrip?: DirectImportRoundTripExecution
  audit?: XmlImportAuditSession
  annotations?: XmlAnomalyAnnotationTable
  xmlNodes?: readonly XmlElementNode[]
  profile?: DirectImportProfile
}

export interface DirectImportXMLPropertyBinding {
  readonly propertyKey: string
  readonly node?: XmlImportAuditedNode
  readonly nodes?: readonly XmlElementNode[]
  readonly owner?: XmlElementNode
  readonly presentInXML: boolean
  /** Значение текущего преобразования, записываемое во внешний файл, а не в YAML. */
  readonly externalValue?: unknown
  readonly xmlPath?: readonly string[]
  /** Смысловое значение намеренно исключено решением зависимостей первого прохода. */
  readonly semanticOmitted?: true
  /** XML поддерево уже полностью перенесено в предметный индекс и не имеет YAML-значения. */
  readonly structurallyClaimed?: true
}

/** Внутренний порт второго прохода. Первый проход фактов его не открывает. */
export interface DirectImportRoundTripExecution {
  readonly attemptParticipant?: object
  finalizeCreatedItem?(item: {
    readonly yaml: Record<string, unknown>
    readonly rule: MetadataItemRule
    readonly yamlPath: YamlPath
    readonly context: ConfigurationContextFromXML
  }): void
  /** Родительская граница: элемент уже включён в именованную коллекцию. */
  placeCollectionItem?(parent: Record<string, unknown>, key: string, yamlPath: YamlPath, sourceYamlPath?: YamlPath): void
  /** Совместимость границы с локальным proof; неподдержанная вложенность проверяется владельцем. */
  accepts?(sources: readonly DirectImportXMLSource[]): boolean
  open(params: {
    readonly context: ConfigurationContextFromXML
    readonly rule: MetadataItemRule
    readonly yaml: Record<string, unknown>
    readonly sources: readonly DirectImportXMLSource[]
    readonly itemName?: string
    readonly yamlPath: YamlPath
    readonly rulePath: readonly DeferredRulePathSegment[]
    readonly dependencies?: PreparedImportDependencies
  }): {
    /** В том числе свойство без результата импорта: его XML-default ещё может сработать. */
    bind?(params: DirectImportXMLPropertyBinding): void
    ready(params: DirectImportXMLPropertyBinding): void
    finish(): void
  }
}

export interface PreparedImportDependencies {
  /** Ключи свойств, добавлявшихся финализатором в конец смыслового YAML. */
  appendedYamlKeys?(itemYamlPath: YamlPath): ReadonlySet<string> | undefined
  /** Рабочие значения обычного экспорта, не подменяющие итоговый YAML. */
  exportPropertyValues?(itemYamlPath: YamlPath): Iterable<readonly [string, unknown]>
  propertyKeys?(itemYamlPath: YamlPath): Iterable<string>
  /** Только подготовленные значения для обратного преобразования. */
  proofPropertyKeys(itemYamlPath: YamlPath): Iterable<string>
  itemFacts?(itemYamlPath: YamlPath, itemType: string): import("./dependentItemRegistry").DependentImportFacts | undefined
  shouldOmit(candidate: ImportedDependentPropertyCandidate, values: Record<string, unknown>): boolean
  /** Полное решение первого прохода; отсутствующее свойство возвращает value: undefined. */
  propertyValue?(itemYamlPath: YamlPath, propertyKey: string): {
    readonly value: unknown
    /** Окончательное решение первого прохода для самого свойства. */
    readonly present?: boolean
    readonly scalarTag?: YAMLScalarTag
  }
}

export interface ImportedDependentPropertyCandidate {
  readonly itemType: string
  readonly itemYamlPath: YamlPath
  readonly itemName?: string
  readonly propertyKey: string
  readonly yamlPath: YamlPath
  readonly logicalAddress?: string
  readonly xmlValue: unknown
  readonly presentInXML: boolean
}

export interface ImportedDependentPropertyCollector {
  accept(candidate: ImportedDependentPropertyCandidate): void
  finish(): readonly ImportedDependentPropertyCandidate[]
}

export function createImportedDependentPropertyCollector(): ImportedDependentPropertyCollector {
  const candidates: ImportedDependentPropertyCandidate[] = []
  const collector: ImportedDependentPropertyCollector = {
    accept(candidate) {
      candidates.push({
        ...candidate,
        itemYamlPath: [...candidate.itemYamlPath],
        yamlPath: [...candidate.yamlPath],
      })
    },
    finish: () => candidates,
  }
  attachXmlImportAttemptAdapter(
    collector,
    arrayLengthXmlImportAttemptAdapter([candidates]),
  )
  return collector
}

export interface DeferredValuePathCollector {
  accept(path: DeferredValuePath): void
  finish(): readonly DeferredValuePath[]
}

export function createDeferredValuePathCollector(): DeferredValuePathCollector {
  const paths: DeferredValuePath[] = []
  const collector: DeferredValuePathCollector = {
    accept(path) {
      paths.push({
        valuePath: [...path.valuePath],
        rulePath: path.rulePath.map((segment) => ({ ...segment })),
      })
    },
    finish: () => paths,
  }
  attachXmlImportAttemptAdapter(
    collector,
    arrayLengthXmlImportAttemptAdapter([paths]),
  )
  return collector
}

export interface DirectImportXMLSource {
  context: ConfigurationContextFromXML
  xml: Record<string, unknown> | XmlElementNode
  /** Исходный корень XMLRoot; тело item может находиться внутри него. */
  envelopeSource?: XmlElementNode
  tags?: string[]
  claimAuditRoot?: boolean
}

export interface DirectImportProfile {
  readonly propertyTypeProfiling: boolean
  propertyTypeProfiles: Record<string, DirectImportPropertyTypeProfile>
  propertyCount: number
  directCount: number
  legacyCount: number
  exportedCount: number
  planningMs: number
  xmlTraversalMs: number
  configurationIndexMs: number
  directInclusiveMs: number
  legacyFromXmlMs: number
  yamlExportMs: number
  defaultMs: number
  outputMs: number
  collectorMs: number
  directByType: Map<string, DirectImportProfileBucket>
  legacyByType: Map<string, DirectImportProfileBucket>
  fusedAtomicCount: number
  fusedAtomicByType: Map<string, DirectImportProfileBucket>
}

export interface DirectImportPropertyTypeProfile {
  propertyCount: number
  inclusiveMs: number
  exclusiveMs: number
}

export interface DirectImportProfileBucket {
  count: number
  timeMs: number
}

export function createDirectImportProfile(
  options: { readonly propertyTypes?: boolean } = {},
): DirectImportProfile {
  return {
    propertyTypeProfiling: options.propertyTypes === true,
    propertyTypeProfiles: {},
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
    fusedAtomicCount: 0,
    fusedAtomicByType: new Map(),
  }
}

export interface DirectImportResult {
  yaml: unknown
  localIndexes: LocalIndexes
  deferred: readonly DeferredValuePath[]
  generatedFiles: ExternalFileEntry[]
}

export type CollectLocalFactsFromYAMLFunction = (params: {
  fact: LocalYamlFact
  writer: LocalMetadataFactsWriter
}) => void

export type {
  DeferredRulePathSegment,
  LocalIndexes,
  LocalIndexesCollector,
  LocalMetadataFactsWriter,
  LocalMetadataIndex,
  LocalYamlFact,
} from "./localFacts"

export type ImportFromXMLToYAMLFunction = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xml: unknown
  name?: string
  ownerXmlName?: string
  traversal: DirectImportTraversal
}) => unknown

export type ResolveNestedImportXMLSourcesFunction = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xml: unknown
  name?: string
  ownerXmlName?: string
  traversal: DirectImportTraversal
}) => readonly DirectImportXMLSource[]

export type NestedItemRule = { itemRule: MetadataItemRule } | { resolveItemRule(itemType: string): MetadataItemRule }

export interface NestedItemIdentityDescriptor {
  reserveWhenAbsent: true
  resolveName(ownerName: string | undefined): string | undefined
}

export type FinalizeImportedYAMLFunction = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
  formDataPathIndex?: FormDataPathIndex
}) => unknown

export type RequiresImportedYAMLFinalizationFunction = (params: { value: unknown }) => boolean

export interface YamlRuleCursor {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
}
