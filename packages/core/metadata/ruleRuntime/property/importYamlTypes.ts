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

export type { DeferredValuePath } from "./deferredObjectValues"

export interface DirectImportTraversal {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
  collector: LocalIndexesCollector
  deferred?: DeferredValuePathCollector
  dependent?: ImportedDependentPropertyCollector
  profile?: DirectImportProfile
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
  return {
    accept(candidate) {
      candidates.push({
        ...candidate,
        itemYamlPath: [...candidate.itemYamlPath],
        yamlPath: [...candidate.yamlPath],
      })
    },
    finish: () => candidates,
  }
}

export interface DeferredValuePathCollector {
  accept(path: DeferredValuePath): void
  finish(): readonly DeferredValuePath[]
}

export function createDeferredValuePathCollector(): DeferredValuePathCollector {
  const paths: DeferredValuePath[] = []
  return {
    accept(path) {
      paths.push({
        valuePath: [...path.valuePath],
        rulePath: path.rulePath.map((segment) => ({ ...segment })),
      })
    },
    finish: () => paths,
  }
}

export interface DirectImportXMLSource {
  context: ConfigurationContextFromXML
  xml: Record<string, unknown>
  tags?: string[]
}

export interface DirectImportProfile {
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
}

export interface DirectImportProfileBucket {
  count: number
  timeMs: number
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
