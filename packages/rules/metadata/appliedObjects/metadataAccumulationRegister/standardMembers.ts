import { selfIndexStandardAttribute as accumulationAttribute, type StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { DataPathContribution } from "../../validation/dataPath/registry"

const members = [
  accumulationAttribute({ names: { internal: "RecordType", yaml: "ВидДвижения" }, family: "standardEnum", name: "ВидДвиженияНакопления" }),
  accumulationAttribute({ names: { internal: "Active", yaml: "Активность" }, family: "primitive", kind: "boolean" }),
  accumulationAttribute({ names: { internal: "LineNumber", yaml: "НомерСтроки" }, family: "primitive", kind: "number" }),
  accumulationAttribute({ names: { internal: "Period", yaml: "Период" }, family: "primitive", kind: "dateTime", fillValue: { policy: "byEffectiveType" } }),
  { memberKind: "standardAttribute", names: { internal: "Recorder", yaml: "Регистратор" }, family: "reverseLookup", phase: "traversal-time", sourceScope: "projectIndex", target: "Document", property: "registerRecords", emptyPolicy: "error", compositePolicy: "errorOnTraversal" },
] as const satisfies readonly StandardMemberDeclaration[]

export const metadataAccumulationRegisterStandardMemberRules: readonly DataPathContribution[] = [
  { kind: "standardMembers", ownerKind: "РегистрНакопления", members },
]
