import type { ConfigurationContext, ConfigurationContextFromXML, ExternalFileEntry } from "../../context/types"
import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"
import type { YamlPath } from "../../validation/yamlLocations"
import type { LocalIndexes, LocalIndexesCollector, LocalMetadataIndex } from "../../project/localIndexes"
import type { MetadataItemRule, PropertyRule } from "./types"

export interface DeferredImportedYamlValue {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
}

export interface DeferredRulePathSegment {
  propertyKey: string
  nestedItemType?: string
}

export interface DirectImportTraversal {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
  collector: LocalIndexesCollector
}

export interface DirectImportResult {
  yaml: unknown
  localIndexes: LocalIndexes
  generatedFiles: ExternalFileEntry[]
}

export interface YamlDiagnosticLocation {
  filePath: string
  line: number
  col: number
}

export interface LocalYamlFact {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
  rule: PropertyRule
  value: unknown
  source?: YamlDiagnosticLocation
}

export { type LocalIndexes, type LocalIndexesCollector, type LocalMetadataIndex }

export type ImportFromXMLToYAMLFunction = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xml: unknown
  name?: string
  ownerXmlName?: string
  traversal: DirectImportTraversal
}) => unknown

export type NestedItemRule =
  | { itemRule: MetadataItemRule }
  | { resolveItemRule(itemType: string): MetadataItemRule }

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
