import { registerStandardMembers, type StandardMemberDeclaration } from "../../validation/dataPath/registry"

const extDimensions = Array.from({ length: 50 }, (_, index) => {
  const number = index + 1
  return [
    { memberKind: "standardAttribute", names: { internal: `ExtDimension${number}`, yaml: `Субконто${number}` }, family: "unsupported", phase: "index-time", sourceScope: "self", reason: `AccountingRegister.ExtDimension${number}` },
    { memberKind: "standardAttribute", names: { internal: `ExtDimensionType${number}`, yaml: `ВидСубконто${number}` }, family: "unsupported", phase: "index-time", sourceScope: "self", reason: `AccountingRegister.ExtDimensionType${number}` },
  ]
}).flat()

const members = [
  { memberKind: "standardAttribute", names: { internal: "PeriodAdjustment", yaml: "УточнениеПериода" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "number" },
  { memberKind: "standardAttribute", names: { internal: "Account", yaml: "Счет" }, family: "objectRefFromProperty", phase: "index-time", sourceScope: "ownerModel", property: "chartOfAccounts" },
  { memberKind: "standardAttribute", names: { internal: "Active", yaml: "Активность" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "LineNumber", yaml: "НомерСтроки" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "number" },
  { memberKind: "standardAttribute", names: { internal: "Period", yaml: "Период" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime" },
  { memberKind: "standardAttribute", names: { internal: "Recorder", yaml: "Регистратор" }, family: "reverseLookup", phase: "traversal-time", sourceScope: "projectIndex", target: "Document", property: "registerRecords", emptyPolicy: "error", compositePolicy: "errorOnTraversal" },
  ...extDimensions,
] as const satisfies readonly StandardMemberDeclaration[]

registerStandardMembers("РегистрБухгалтерии", members)
