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
  readonly propertyChanges: readonly ScenarioFileChange[]
  readonly dependsOn: readonly string[]
}

export type ChildDeclaration = {
  readonly key: string
  readonly name: string
  readonly ownerKey: string
  readonly propertyKey: string
  readonly childItemType: string
  readonly changes: readonly ScenarioFileChange[]
  readonly propertyChanges: readonly ScenarioFileChange[]
  readonly dependsOn: readonly string[]
}

export type FormDeclaration = {
  readonly key: string
  readonly ownerKey: string
  readonly changes: readonly ScenarioFileChange[]
}

export type TemplateDeclaration = {
  readonly key: string
  readonly ownerKey: string
  readonly retainedWithOwner: boolean
  readonly changes: readonly ScenarioFileChange[]
}

export type ScenarioMatrix = {
  readonly configurationOperations?: readonly ScenarioOperation[]
  readonly structuralOperations?: readonly ScenarioOperation[]
  readonly childPropertyOperations?: readonly ScenarioOperation[]
  readonly orderSetupOperations?: readonly ScenarioOperation[]
  readonly orderOperations?: readonly ScenarioOperation[]
  readonly formLifecycleOperations?: readonly ScenarioOperation[]
  readonly templates?: readonly TemplateDeclaration[]
  readonly templateChangeOperations?: readonly ScenarioOperation[]
  readonly templateRemovalOperations?: readonly ScenarioOperation[]
  readonly roots: readonly RootObjectDeclaration[]
  readonly children: readonly ChildDeclaration[]
  readonly forms: readonly FormDeclaration[]
  readonly layers?: readonly ScenarioLayer[]
}

export type ScenarioOperation = {
  readonly key: string
  readonly kind: "create-object" | "add-child" | "add-form" | "change" | "remove"
  readonly ownerKey?: string
  readonly targetKey?: string
  readonly changes: readonly ScenarioFileChange[]
  readonly dependsOn?: readonly string[]
}

export type ScenarioComponentPath = "cf" | `cfe/${string}`

export type ScenarioLayer = {
  readonly key: string
  readonly componentPath: ScenarioComponentPath
  readonly probeOperationKey: string
  readonly bulkBlockSize?: number
  readonly operations: readonly ScenarioOperation[]
}

export type ScenarioBlock = {
  readonly key: `${string}:probe` | `${string}:bulk` | `${string}:bulk:${number}`
  readonly layerKey: string
  readonly componentPath: ScenarioComponentPath
  readonly operations: readonly ScenarioOperation[]
}
