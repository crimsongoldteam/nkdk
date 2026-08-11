import { selfIndexStandardAttribute as journalAttribute, type StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { DataPathContribution } from "../../validation/dataPath/registry"

const members = [
  journalAttribute({ names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject" }),
  journalAttribute({ names: { internal: "Type", yaml: "Тип" }, family: "opaque", allowNestedProperties: false }),
  journalAttribute({ names: { internal: "Date", yaml: "Дата" }, family: "primitive", kind: "dateTime", fillValue: { policy: "byEffectiveType" } }),
  journalAttribute({ names: { internal: "Number", yaml: "Номер" }, family: "primitive", kind: "string" }),
  journalAttribute({ names: { internal: "Posted", yaml: "Проведен" }, family: "primitive", kind: "boolean" }),
  journalAttribute({ names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", kind: "boolean" }),
] as const satisfies readonly StandardMemberDeclaration[]

export const metadataDocumentJournalStandardMemberRules: readonly DataPathContribution[] = [
  { kind: "standardMembers", ownerKind: "ЖурналДокументов", members },
]
