import { selfIndexStandardAttribute as documentAttribute, type StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { DataPathContribution } from "../../validation/dataPath/registry"

const documentMembers = [
  documentAttribute({ names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject" }),
  documentAttribute({ names: { internal: "Date", yaml: "Дата" }, family: "primitive", kind: "dateTime", fillValue: { policy: "byEffectiveType" } }),
  { memberKind: "standardAttribute", names: { internal: "Number", yaml: "Номер" }, family: "numberByProperty", phase: "index-time", sourceScope: "ownerModel", property: "numberType" },
  documentAttribute({ names: { internal: "Posted", yaml: "Проведен" }, family: "primitive", kind: "boolean" }),
  documentAttribute({ names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", kind: "boolean" }),
] as const satisfies readonly StandardMemberDeclaration[]

export const metadataDocumentStandardMemberRules: readonly DataPathContribution[] = [
  { kind: "standardMembers", ownerKind: "Документ", members: documentMembers },
  { kind: "standardMembers", ownerKind: "ДокументОбъект", members: documentMembers },
]
