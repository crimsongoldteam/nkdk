import type { ObjectFieldIndex } from "../validation/dataPath/objectFields"

export interface FullXmlSyncOutput {
  readonly targetXmlPath: string
  readonly routeKind: "owner" | "fileItem"
}

export interface FullXmlSyncAssignment {
  readonly id: string
  readonly sourceProjectPath: string
  readonly sourcePath: string
  readonly role: "configuration" | "properties" | "form"
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly owner?: { readonly itemType: string; readonly name: string; readonly logicalAddress: string }
  readonly outputs: readonly FullXmlSyncOutput[]
}

export interface FullXmlSyncExternalFile {
  readonly sourceProjectPath: string
  readonly sourcePath: string
  readonly targetXmlPath: string
}

export interface FullXmlSyncPlan {
  readonly assignments: readonly FullXmlSyncAssignment[]
  readonly externalFiles: readonly FullXmlSyncExternalFile[]
}

export interface FullXmlSyncOwnerFacts {
  readonly assignmentId: string
  readonly sourceProjectPath: string
  readonly sourcePath: string
  readonly role: FullXmlSyncAssignment["role"]
  readonly owner: { readonly dir: string; readonly name: string }
  readonly itemType: string
  readonly ownerModelStub?: Record<string, unknown>
  readonly fieldIndex?: ObjectFieldIndex
}
