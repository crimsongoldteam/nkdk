export const PROJECT_STATE_HASH_BYTE_LENGTH = 8

export type ProjectStateResourceKind = "yaml" | "resource"
export type ProjectStateYamlRole = "configuration" | "properties" | "form"

export interface ProjectStateFileIdentity {
  readonly projectPath: string
  readonly componentPath: string
  readonly resourceKind: ProjectStateResourceKind
  readonly yamlRole?: ProjectStateYamlRole
}

export interface ProjectStateFileHashBatch {
  readonly files: readonly ProjectStateFileIdentity[]
  readonly hashBytes: Uint8Array
}

export interface ProjectStateFileBaseline {
  readonly knownHashBits: Uint8Array
  readonly hashBytes: Uint8Array
  readonly deleted: readonly ProjectStateFileIdentity[]
}

export interface ProjectStateFileBaselinePage {
  readonly knownHashBits: Uint8Array
  readonly hashBytes: Uint8Array
  readonly previousFileIds: Int32Array
  readonly storedFileCount: number
}

export type ProjectStateFileBaselinePathPage = ProjectStateFileBaselinePage
