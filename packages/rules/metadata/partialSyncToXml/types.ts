export interface PartialXmlFileVersion {
  readonly projectPath: string
  readonly contentHash: bigint
}

export interface PartialXmlChanges {
  readonly added: readonly PartialXmlFileVersion[]
  readonly changed: readonly {
    readonly current: PartialXmlFileVersion
    readonly previous: PartialXmlFileVersion
  }[]
  readonly deleted: readonly PartialXmlFileVersion[]
}
