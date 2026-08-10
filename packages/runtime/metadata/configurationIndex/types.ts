export interface ConfigurationProjectFile {
  projectPath: string
  contentHash: bigint
}

export interface ConfigurationSnapshot {
  readonly specificationVersion: "1.3"
  readonly indexGeneration: bigint
  readonly componentPath: string
  readonly files: readonly ConfigurationSnapshotFile[]
  readonly entities: readonly ConfigurationSnapshotEntity[]
}

export interface ConfigurationSnapshotFile {
  readonly projectPath: string
  readonly contentHash: bigint
}

export interface ConfigurationSnapshotEntity {
  readonly logicalAddress: string
  readonly sourceProjectPath: string
  readonly identities?: {
    readonly uuid?: string
    readonly xmlId?: string
    readonly xmlName?: string
  }
  readonly omittedChildren?: OmittedChildren
  readonly xml?: ConfigurationSnapshotXml
}

export type OmittedChildren =
  | { readonly kind: "names"; readonly names: readonly string[] }
  | {
      readonly kind: "typedNames"
      readonly items: readonly {
        readonly xmlName: string
        readonly name: string
      }[]
    }

export interface ConfigurationSnapshotXml {
  readonly extended?: true
  readonly xsiNil?: true
  readonly explicitEmpty?: true
  readonly xsiType?: string
  readonly xmlText?: string
  readonly xmlPrefix?: string
}

export interface ConfigurationSnapshotFragment {
  readonly targetProjectPath: string
  readonly entities: readonly ConfigurationSnapshotEntity[]
}

export interface MergedConfigurationSnapshotFragments {
  readonly sourceProjectPaths: readonly string[]
  readonly entities: readonly ConfigurationSnapshotEntity[]
}
