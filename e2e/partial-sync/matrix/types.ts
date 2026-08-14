export type ScenarioFileContents = string | Uint8Array

export type ScenarioFileChange = {
  readonly path: string
  readonly before: ScenarioFileContents | null
  readonly after: ScenarioFileContents | null
}

export type RootObjectDeclaration = {
  readonly key: string
  readonly itemType: string
  readonly name: string
  readonly changes: readonly ScenarioFileChange[]
  readonly dependsOn: readonly string[]
}

export type ChildDeclaration = {
  readonly key: string
  readonly ownerKey: string
  readonly propertyKey: string
  readonly childItemType: string
  readonly changes: readonly ScenarioFileChange[]
  readonly dependsOn: readonly string[]
}

export type FormDeclaration = {
  readonly key: string
  readonly ownerKey: string
  readonly changes: readonly ScenarioFileChange[]
}

export type ScenarioMatrix = {
  readonly roots: readonly RootObjectDeclaration[]
  readonly children: readonly ChildDeclaration[]
  readonly forms: readonly FormDeclaration[]
}

export type ScenarioOperation = {
  readonly key: string
  readonly kind: "create-object" | "add-child" | "add-form" | "remove"
  readonly ownerKey?: string
  readonly targetKey?: string
  readonly changes: readonly ScenarioFileChange[]
}
