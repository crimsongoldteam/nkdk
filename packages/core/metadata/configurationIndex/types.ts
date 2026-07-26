import type { PersistedSharedValidationSnapshot } from "../validation/persistedSharedValidationSnapshot"
import type {
  ProjectLocalDependency,
  ProjectLogicalAddressEntry,
} from "../project/componentIndexFacts"

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
  excludedEqualName?: true
  xsiType?: string
  xmlText?: string
  xmlPrefix?: string
  userSettingsId?: string
}

export type ConfigurationLocalDependencyRulePathSegment =
  ProjectLocalDependency["rulePath"][number]

export type ConfigurationLocalDependency = ProjectLocalDependency

export type ComponentLogicalAddress = ProjectLogicalAddressEntry

export interface ConfigurationLocalIndexes {
  metadata: PersistedSharedValidationSnapshot
  dependencies: readonly ConfigurationLocalDependency[]
  logicalAddresses: readonly ComponentLogicalAddress[]
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
