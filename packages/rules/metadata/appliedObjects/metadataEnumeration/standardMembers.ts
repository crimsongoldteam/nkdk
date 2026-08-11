import { selfIndexStandardAttribute, type StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { DataPathContribution } from "../../validation/dataPath/registry"

const members = [
  selfIndexStandardAttribute({ names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject" }),
  selfIndexStandardAttribute({ names: { internal: "Order", yaml: "Порядок" }, family: "primitive", kind: "number" }),
] as const satisfies readonly StandardMemberDeclaration[]

export const metadataEnumerationStandardMemberRules: readonly DataPathContribution[] = [
  { kind: "standardMembers", ownerKind: "Перечисление", members },
]
