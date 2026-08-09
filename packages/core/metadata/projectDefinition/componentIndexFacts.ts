export interface ProjectLogicalAddressEntry {
  readonly logicalAddress: string
  readonly sourceProjectPath: string
}

export interface ProjectLocalDependency {
  readonly sourceProjectPath: string
  readonly yamlPath: readonly (string | number)[]
  readonly rulePath: readonly {
    readonly propertyKey: string
    readonly nestedItemType?: string
  }[]
  readonly kind: "metadataTarget"
  readonly canonical: string
}
