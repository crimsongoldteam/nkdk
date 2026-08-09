import { registerStandardMembers, type StandardMemberDeclaration } from "../../standardMembers/declarations"

const exchangePlanIdentityMembers = [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Code", yaml: "Код" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
  { memberKind: "standardAttribute", names: { internal: "Description", yaml: "Наименование" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
] as const satisfies readonly StandardMemberDeclaration[]

const members = [
  ...exchangePlanIdentityMembers,
  { memberKind: "standardAttribute", names: { internal: "ThisNode", yaml: "ЭтотУзел" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "ExchangeDate", yaml: "ДатаОбмена" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "dateTime", fillValue: { policy: "byEffectiveType" } },
  { memberKind: "standardAttribute", names: { internal: "SentNo", yaml: "НомерОтправленного" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "number" },
  { memberKind: "standardAttribute", names: { internal: "ReceivedNo", yaml: "НомерПринятого" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "number" },
  { memberKind: "standardAttribute", names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
] as const satisfies readonly StandardMemberDeclaration[]

registerStandardMembers("ПланОбмена", members)
registerStandardMembers("ПланОбменаОбъект", members)
