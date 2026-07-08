import { registerStandardMembers, type StandardMemberDeclaration } from "../../validation/dataPath/registry"

registerStandardMembers("Перечисление", [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Order", yaml: "Порядок" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "number" },
] as const satisfies readonly StandardMemberDeclaration[])
