import type { StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { DataPathContribution } from "../../validation/dataPath/registry"

const members = [
  { memberKind: "standardAttribute", names: { internal: "Active", yaml: "Активность" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "LineNumber", yaml: "НомерСтроки" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "number" },
  { memberKind: "standardAttribute", names: { internal: "Period", yaml: "Период" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime", fillValue: { policy: "byEffectiveType" } },
  { memberKind: "standardAttribute", names: { internal: "Recorder", yaml: "Регистратор" }, family: "reverseLookup", phase: "traversal-time", sourceScope: "projectIndex", target: "Document", property: "registerRecords", emptyPolicy: "error", compositePolicy: "errorOnTraversal" },
] as const satisfies readonly StandardMemberDeclaration[]

export const metadataInformationRegisterStandardMemberRules: readonly DataPathContribution[] = [
  { kind: "standardMembers", ownerKind: "РегистрСведений", members },
]
