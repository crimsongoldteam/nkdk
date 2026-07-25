import type { ConfigurationContext, ConfigurationContextFromXML, ExternalFileEntry } from "../../context/types"
import type { MetadataTargetOwner } from "../../commonObjects/metadataTargets/types"
import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"
import type { YamlDiagnosticLocation, YamlPath } from "../../validation/yamlLocations"
import type { LocalIndexes, LocalIndexesCollector, LocalMetadataIndex } from "../../project/localIndexes"
import type { MetadataItemRule, PropertyRule } from "./types"
import type { DeferredValuePath } from "./deferredObjectValues"

export type { DeferredValuePath } from "./deferredObjectValues"

export interface DeferredRulePathSegment {
  propertyKey: string
  nestedItemType?: string
}

export interface DirectImportTraversal {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
  collector: LocalIndexesCollector
  deferred?: DeferredValuePathCollector
  profile?: DirectImportProfile
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

export interface LocalYamlFact {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
  rule: PropertyRule
  value: unknown
  source?: YamlDiagnosticLocation
  metadataTargetOwner?: MetadataTargetOwner
}

export interface LocalMetadataFactsWriter {
  setOwnerFact(role: string, value: unknown): void
}

export type CollectLocalFactsFromYAMLFunction = (params: {
  fact: LocalYamlFact
  writer: LocalMetadataFactsWriter
}) => void

export { type LocalIndexes, type LocalIndexesCollector, type LocalMetadataIndex }

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

export type FinalizeImportedYAMLFunction = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
  formDataPathIndex?: FormDataPathIndex
}) => unknown

export interface YamlRuleCursor {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
}
