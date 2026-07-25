import type { PersistedSharedValidationSnapshot } from "../validation/persistedSharedValidationSnapshot"

export interface ConfigurationIndexBinding {
  indexGeneration: bigint
  producerVersion: string
  componentPath: string
  baseFingerprint: Uint8Array
  configurationVersion: Uint8Array
}

export interface ConfigurationProjectFile {
  projectPath: string
  contentHash: bigint
}

export type ConfigurationIdentity =
  | { logicalAddress: string; kind: "uuid"; value: string }
  | { logicalAddress: string; kind: "xmlId" | "xmlName"; value: string }

export interface ConfigurationXmlNode {
  logicalAddress: string
  order?: readonly string[]
  aliases?: Readonly<Record<string, string>>
  present?: readonly string[]
}

export interface ConfigurationXmlValue {
  logicalAddress: string
  extended?: true
  xsiNil?: true
  explicitEmpty?: true
  xsiType?: string
  xmlText?: string
  xmlPrefix?: string
  userSettingsId?: string
}

export interface ConfigurationLocalDependencyRulePathSegment {
  propertyKey: string
  nestedItemType?: string
}

export interface ConfigurationLocalDependency {
  sourceProjectPath: string
  yamlPath: readonly (string | number)[]
  rulePath: readonly ConfigurationLocalDependencyRulePathSegment[]
  kind: "metadataTarget"
  canonical: string
}

export interface ConfigurationLocalIndexes {
  metadata: PersistedSharedValidationSnapshot
  dependencies: readonly ConfigurationLocalDependency[]
}

export interface ConfigurationIndexData {
  binding: ConfigurationIndexBinding
  projectFiles: readonly ConfigurationProjectFile[]
  identities: readonly ConfigurationIdentity[]
  xmlNodes: readonly ConfigurationXmlNode[]
  xmlValues: readonly ConfigurationXmlValue[]
  localIndexes: ConfigurationLocalIndexes
}

export interface ConfigurationIndexFragment {
  targetProjectPath: string
  identities: readonly ConfigurationIdentity[]
  xmlNodes: readonly ConfigurationXmlNode[]
  xmlValues: readonly ConfigurationXmlValue[]
  localDependencies?: readonly ConfigurationLocalDependency[]
}
