export interface ConfigurationProjectFile {
  projectPath: string
  contentHash: bigint
}

export interface ConfigurationIndexChild {
  readonly xmlName: string
  readonly name: string
}

export interface ConfigurationIndexBlockEntity {
  readonly logicalAddress: string
  readonly uuid?: string
  readonly xmlId?: string
  readonly children?: readonly ConfigurationIndexChild[]
}

export interface ConfigurationIndexBlock {
  readonly entities: readonly ConfigurationIndexBlockEntity[]
}

export interface ConfigurationIndexBlockFragment {
  readonly targetProjectPath: string
  readonly entities: readonly ConfigurationIndexBlockEntity[]
}

export interface ConfigurationIndexFragmentCollection {
  readonly fragments: readonly ConfigurationIndexBlockFragment[]
}
