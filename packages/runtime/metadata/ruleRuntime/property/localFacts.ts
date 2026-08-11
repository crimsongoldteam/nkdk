import type { MetadataTargetConstraint, MetadataTargetOwner } from "../metadataTarget/types"
import type { YamlDiagnosticLocation, YamlPath } from "../../diagnostics/types"
import type { OwnerFactRole } from "./ownerFactRole"

export interface LocalFactPropertyRule {
  type: string
  yaml?: string
  metadataTarget?: MetadataTargetConstraint
  ownerFactRole?: OwnerFactRole
}

export interface DeferredRulePathSegment {
  propertyKey: string
  nestedItemType?: string
}

export interface LocalYamlFact {
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
  rule: LocalFactPropertyRule
  value: unknown
  source?: YamlDiagnosticLocation
  metadataTargetOwner?: MetadataTargetOwner
}

export interface LocalMetadataFactsWriter {
  setOwnerFact(role: string, value: unknown): void
  setMetadataTargetValues(values: readonly { value: string; yamlPath: YamlPath }[]): void
}

export interface LocalYamlItemFact {
  readonly itemType: string
  readonly name?: string
  readonly yamlPath: LocalYamlFact["yamlPath"]
  readonly rulePath: LocalYamlFact["rulePath"]
}

export type LocalMetadataEvent =
  | {
      kind: "item"
      itemType: string
      name?: string
      yamlPath: readonly (string | number)[]
      rulePath: LocalYamlFact["rulePath"]
    }
  | {
      kind: "property" | "complete"
      yamlPath: readonly (string | number)[]
      rulePath: LocalYamlFact["rulePath"]
      propertyType: string
      source?: LocalYamlFact["source"]
    }

export interface LocalMetadataTargetFact {
  yamlPath: readonly (string | number)[]
  value: string
  constraint: NonNullable<LocalYamlFact["rule"]["metadataTarget"]>
  owner?: NonNullable<LocalYamlFact["metadataTargetOwner"]>
  rulePath: LocalYamlFact["rulePath"]
}

export interface LocalMetadataIndex {
  events: LocalMetadataEvent[]
  ownerFacts?: Readonly<Record<string, unknown>>
  metadataTargets?: LocalMetadataTargetFact[]
}

export interface LocalIndexes {
  metadata: LocalMetadataIndex
}

export interface LocalIndexesCollector {
  acceptItem(fact: LocalYamlItemFact): void
  acceptProperty(fact: LocalYamlFact): void
  completeValue(fact: LocalYamlFact): void
  finish(): LocalIndexes
}
