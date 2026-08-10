import type { StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { DataPathContribution } from "../../validation/dataPath/registry"

const members = [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Order", yaml: "Порядок" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "number" },
] as const satisfies readonly StandardMemberDeclaration[]

export const metadataEnumerationStandardMemberRules: readonly DataPathContribution[] = [
  { kind: "standardMembers", ownerKind: "Перечисление", members },
]
