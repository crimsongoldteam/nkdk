import type { StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { DataPathContribution } from "../../validation/dataPath/registry"

const documentMembers = [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Date", yaml: "Дата" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime", fillValue: { policy: "byEffectiveType" } },
  { memberKind: "standardAttribute", names: { internal: "Number", yaml: "Номер" }, family: "numberByProperty", phase: "index-time", sourceScope: "ownerModel", property: "numberType" },
  { memberKind: "standardAttribute", names: { internal: "Posted", yaml: "Проведен" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
] as const satisfies readonly StandardMemberDeclaration[]

export const metadataDocumentStandardMemberRules: readonly DataPathContribution[] = [
  { kind: "standardMembers", ownerKind: "Документ", members: documentMembers },
  { kind: "standardMembers", ownerKind: "ДокументОбъект", members: documentMembers },
]
