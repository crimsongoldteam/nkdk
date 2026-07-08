import { registerStandardMembers, type StandardMemberDeclaration } from "../../validation/dataPath/registry"

const indexTimeMembers = [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Date", yaml: "Дата" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime" },
  { memberKind: "standardAttribute", names: { internal: "Number", yaml: "Номер" }, family: "numberByProperty", phase: "index-time", sourceScope: "ownerModel", property: "numberType" },
  { memberKind: "standardAttribute", names: { internal: "Executed", yaml: "Выполнена" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "Description", yaml: "Описание" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
  { memberKind: "standardAttribute", names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
] as const

const traversalMembers = [
  { memberKind: "standardAttribute", names: { internal: "BusinessProcess", yaml: "БизнесПроцесс" }, family: "reverseLookup", phase: "traversal-time", sourceScope: "projectIndex", target: "BusinessProcess", property: "tasks", emptyPolicy: "error", compositePolicy: "errorOnTraversal" },
  { memberKind: "standardAttribute", names: { internal: "RoutePoint", yaml: "ТочкаМаршрута" }, family: "closedReverseLookup", phase: "traversal-time", sourceScope: "projectIndex", target: "BusinessProcess", result: "BusinessProcessRoutePoint", source: "businessProcessesByTask", property: "tasks", emptyPolicy: "error", allowNestedProperties: false },
] as const

const members = [...indexTimeMembers, ...traversalMembers] as const satisfies readonly StandardMemberDeclaration[]

registerStandardMembers("Задача", members)
registerStandardMembers("ЗадачаОбъект", members)
