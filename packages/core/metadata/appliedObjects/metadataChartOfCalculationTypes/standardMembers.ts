import { registerStandardMembers, type StandardMemberDeclaration } from "../../validation/dataPath/registry"

const tableColumns = [
  { memberKind: "standardTabularSectionColumn", names: { internal: "CalculationType", yaml: "ВидРасчета" }, family: "sameOwnerObject" },
  { memberKind: "standardTabularSectionColumn", names: { internal: "LineNumber", yaml: "НомерСтроки" }, family: "primitive", kind: "number" },
  { memberKind: "standardTabularSectionColumn", names: { internal: "Predefined", yaml: "Предопределенный" }, family: "primitive", kind: "boolean" },
] as const

const members = [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Code", yaml: "Код" }, family: "codeByProperty", phase: "index-time", sourceScope: "ownerModel", property: "codeType" },
  { memberKind: "standardAttribute", names: { internal: "Description", yaml: "Наименование" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
  { memberKind: "standardAttribute", names: { internal: "ActionPeriodIsBasic", yaml: "ПериодДействияБазовый" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "Predefined", yaml: "Предопределенный" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "PredefinedDataName", yaml: "ИмяПредопределенныхДанных" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
  { memberKind: "standardTabularSection", names: { internal: "LeadingCalculationTypes", yaml: "ВедущиеВидыРасчета" }, family: "standardTable", phase: "traversal-time", sourceScope: "self", tableKind: "ValueTable", columns: tableColumns },
  { memberKind: "standardTabularSection", names: { internal: "DisplacingCalculationTypes", yaml: "ВытесняющиеВидыРасчета" }, family: "standardTable", phase: "traversal-time", sourceScope: "self", tableKind: "ValueTable", columns: tableColumns },
  { memberKind: "standardTabularSection", names: { internal: "BaseCalculationTypes", yaml: "БазовыеВидыРасчета" }, family: "standardTable", phase: "traversal-time", sourceScope: "self", tableKind: "ValueTable", columns: tableColumns },
] as const satisfies readonly StandardMemberDeclaration[]

registerStandardMembers("ПланВидовРасчета", members)
registerStandardMembers("ПланВидовРасчетаОбъект", members)
