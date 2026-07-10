import { registerStandardMembers, type StandardMemberDeclaration } from "../../validation/dataPath/registry"

const members = [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Date", yaml: "Дата" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime" },
  { memberKind: "standardAttribute", names: { internal: "Number", yaml: "Номер" }, family: "numberByProperty", phase: "index-time", sourceScope: "ownerModel", property: "numberType" },
  { memberKind: "standardAttribute", names: { internal: "Started", yaml: "Стартован" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "Completed", yaml: "Завершен" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "HeadTask", yaml: "ГоловнаяЗадача" }, family: "objectRefFromProperty", phase: "index-time", sourceScope: "ownerModel", property: "task" },
  { memberKind: "standardAttribute", names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
] as const satisfies readonly StandardMemberDeclaration[]

registerStandardMembers("БизнесПроцесс", members)
registerStandardMembers("БизнесПроцессОбъект", members)
