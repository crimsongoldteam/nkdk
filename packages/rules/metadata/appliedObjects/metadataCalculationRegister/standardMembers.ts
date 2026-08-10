import type { StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { DataPathContribution } from "../../validation/dataPath/registry"

const members = [
  { memberKind: "standardAttribute", names: { internal: "RegistrationPeriod", yaml: "ПериодРегистрации" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime", fillValue: { policy: "byEffectiveType" } },
  { memberKind: "standardAttribute", names: { internal: "ReversingEntry", yaml: "Сторно" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "Active", yaml: "Активность" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "BegOfActionPeriod", yaml: "НачалоПериодаДействия" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime", fillValue: { policy: "byEffectiveType" } },
  { memberKind: "standardAttribute", names: { internal: "EndOfActionPeriod", yaml: "КонецПериодаДействия" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime", fillValue: { policy: "byEffectiveType" } },
  { memberKind: "standardAttribute", names: { internal: "ActionPeriod", yaml: "ПериодДействия" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime", fillValue: { policy: "byEffectiveType" } },
  { memberKind: "standardAttribute", names: { internal: "BegOfBasePeriod", yaml: "НачалоБазовогоПериода" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime", fillValue: { policy: "byEffectiveType" } },
  { memberKind: "standardAttribute", names: { internal: "EndOfBasePeriod", yaml: "КонецБазовогоПериода" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime", fillValue: { policy: "byEffectiveType" } },
  { memberKind: "standardAttribute", names: { internal: "CalculationType", yaml: "ВидРасчета" }, family: "objectRefFromProperty", phase: "index-time", sourceScope: "ownerModel", property: "chartOfCalculationTypes" },
  { memberKind: "standardAttribute", names: { internal: "LineNumber", yaml: "НомерСтроки" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "number" },
  { memberKind: "standardAttribute", names: { internal: "Recorder", yaml: "Регистратор" }, family: "reverseLookup", phase: "traversal-time", sourceScope: "projectIndex", target: "Document", property: "registerRecords", emptyPolicy: "error", compositePolicy: "errorOnTraversal" },
] as const satisfies readonly StandardMemberDeclaration[]

export const metadataCalculationRegisterStandardMemberRules: readonly DataPathContribution[] = [
  { kind: "standardMembers", ownerKind: "РегистрРасчета", members },
]
