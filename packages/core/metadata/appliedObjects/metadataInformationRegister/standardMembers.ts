import { registerStandardMembers, type StandardMemberDeclaration } from "../../validation/dataPath/registry"

registerStandardMembers("РегистрСведений", [
  { memberKind: "standardAttribute", names: { internal: "Active", yaml: "Активность" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "LineNumber", yaml: "НомерСтроки" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "number" },
  { memberKind: "standardAttribute", names: { internal: "Period", yaml: "Период" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime" },
  { memberKind: "standardAttribute", names: { internal: "Recorder", yaml: "Регистратор" }, family: "reverseLookup", phase: "traversal-time", sourceScope: "projectIndex", target: "Document", property: "registerRecords", emptyPolicy: "error", compositePolicy: "errorOnTraversal" },
] as const satisfies readonly StandardMemberDeclaration[])
