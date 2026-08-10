import type { FormDataPathTabularElementDeclaration } from "../dataPath/formIndex"

export interface FormTabularElementVisit {
  readonly name: string
  readonly itemType: string
  readonly primaryDataPath?: {
    readonly value: unknown
  }
}

export function acceptFormTabularElementVisit(
  result: Map<string, FormDataPathTabularElementDeclaration>,
  visit: FormTabularElementVisit
): void {
  if (visit.itemType !== "Table" || result.has(visit.name)) return
  const dataPath = visit.primaryDataPath?.value
  result.set(visit.name, {
    kind: "tabularFormElement",
    ...(typeof dataPath === "string" && dataPath.trim().length > 0 ? { dataPath } : {}),
  })
}
