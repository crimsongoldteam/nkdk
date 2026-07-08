import { registerStandardMembers, type StandardMemberDeclaration } from "../../validation/dataPath/registry"

const members = [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "ValueType", yaml: "ТипЗначения" }, family: "typeDescription", phase: "index-time", sourceScope: "self", allowNestedProperties: false },
  { memberKind: "standardAttribute", names: { internal: "Code", yaml: "Код" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
  { memberKind: "standardAttribute", names: { internal: "Description", yaml: "Наименование" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
  { memberKind: "standardAttribute", names: { internal: "Parent", yaml: "Родитель" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "IsFolder", yaml: "ЭтоГруппа" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "Predefined", yaml: "Предопределенный" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "PredefinedDataName", yaml: "ИмяПредопределенныхДанных" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
] as const satisfies readonly StandardMemberDeclaration[]

registerStandardMembers("ПланВидовХарактеристик", members)
registerStandardMembers("ПланВидовХарактеристикОбъект", members)
