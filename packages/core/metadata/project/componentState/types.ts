import type { ComponentAddress } from "../../components/address"
import type { ConfigurationProjectFile } from "../../configurationIndex"
import type {
  ConfigurationLocalDependency,
  SharedConfigurationIndexSnapshot,
} from "../../configurationIndex"
import type { SharedValidationSnapshot } from "../../validation/sharedValidationSnapshot"
import type { ProjectLogicalAddressEntry } from "../componentIndexFacts"
import type { MetadataProjectResourceMatch } from "../../resourceTopology/projectProjection"
import type { CompiledMetadataResourceTopology } from "../../resourceTopology/types"

export interface ComponentProjectStructure {
  readonly address: ComponentAddress
  readonly componentPath: string
  readonly componentDir: string
  readonly topology: CompiledMetadataResourceTopology
  readonly resources: readonly MetadataProjectResourceMatch[]
  readonly projectPaths: readonly string[]
}

export interface ComponentHashState {
  readonly componentPath: string
  readonly projectFiles: readonly ConfigurationProjectFile[]
}

export interface ComponentIndexes {
  readonly componentPath: string
  readonly sourceProjectFiles: readonly ConfigurationProjectFile[]
  readonly metadata: SharedValidationSnapshot
  readonly dependencies: readonly ConfigurationLocalDependency[]
  readonly logicalAddresses: readonly ProjectLogicalAddressEntry[]
}

export interface ConfirmedComponentState {
  readonly structure: ComponentProjectStructure
  readonly hashes: ComponentHashState
  readonly indexes: ComponentIndexes
  readonly snapshot: SharedConfigurationIndexSnapshot
}
