import { selfIndexStandardAttribute as informationAttribute, type StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { DataPathContribution } from "../../validation/dataPath/registry"

const members = [
  informationAttribute({ names: { internal: "Active", yaml: "Активность" }, family: "primitive", kind: "boolean" }),
  informationAttribute({ names: { internal: "LineNumber", yaml: "НомерСтроки" }, family: "primitive", kind: "number" }),
  informationAttribute({ names: { internal: "Period", yaml: "Период" }, family: "primitive", kind: "dateTime", fillValue: { policy: "byEffectiveType" } }),
  { memberKind: "standardAttribute", names: { internal: "Recorder", yaml: "Регистратор" }, family: "reverseLookup", phase: "traversal-time", sourceScope: "projectIndex", target: "Document", property: "registerRecords", emptyPolicy: "error", compositePolicy: "errorOnTraversal" },
] as const satisfies readonly StandardMemberDeclaration[]

export const metadataInformationRegisterStandardMemberRules: readonly DataPathContribution[] = [
  { kind: "standardMembers", ownerKind: "РегистрСведений", members },
]
