import type { ComponentAddress } from "../../components/address"
import type { ConfigurationProjectFile } from "../../configurationIndex"
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
