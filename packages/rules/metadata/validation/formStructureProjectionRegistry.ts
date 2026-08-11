import type { ProjectStateStructuredDocumentEntry } from "../projectState/fileUpdate"
import type { FormStructuredComponent } from "./formContracts"

export type RegisteredFormStructureProjection = (params: {
  readonly components: readonly FormStructuredComponent[]
  readonly representation: "working" | "base"
  readonly logicalAddress: string
  readonly workingProjectPath: string
}) => readonly ProjectStateStructuredDocumentEntry[]

let projection: RegisteredFormStructureProjection | undefined

export function registerFormStructureProjection(value: RegisteredFormStructureProjection): void {
  projection = value
}

export function getRegisteredFormStructureProjection(): RegisteredFormStructureProjection | undefined {
  return projection
}
