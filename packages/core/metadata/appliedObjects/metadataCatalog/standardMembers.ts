import { registerStandardMembers, type StandardMemberDeclaration } from "../../validation/dataPath/registry"

const catalogMembers = [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Parent", yaml: "Родитель" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Owner", yaml: "Владелец" }, family: "objectRefsFromProperty", phase: "index-time", sourceScope: "ownerModel", property: "owners", compositePolicy: "errorOnTraversal" },
  { memberKind: "standardAttribute", names: { internal: "Code", yaml: "Код" }, family: "codeByProperty", phase: "index-time", sourceScope: "ownerModel", property: "codeType" },
  { memberKind: "standardAttribute", names: { internal: "Description", yaml: "Наименование" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
  { memberKind: "standardAttribute", names: { internal: "IsFolder", yaml: "ЭтоГруппа" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "Predefined", yaml: "Предопределенный" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "PredefinedDataName", yaml: "ИмяПредопределенныхДанных" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
] as const satisfies readonly StandardMemberDeclaration[]

registerStandardMembers("Справочник", catalogMembers)
registerStandardMembers("СправочникОбъект", catalogMembers)
