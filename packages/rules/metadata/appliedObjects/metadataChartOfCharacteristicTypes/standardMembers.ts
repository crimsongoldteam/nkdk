import { selfIndexStandardAttribute, type StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { DataPathContribution } from "../../validation/dataPath/registry"

const members = [
  selfIndexStandardAttribute({ names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject" }),
  selfIndexStandardAttribute({ names: { internal: "ValueType", yaml: "ТипЗначения" }, family: "typeDescription", allowNestedProperties: false }),
  selfIndexStandardAttribute({ names: { internal: "Code", yaml: "Код" }, family: "primitive", kind: "string" }),
  selfIndexStandardAttribute({ names: { internal: "Description", yaml: "Наименование" }, family: "primitive", kind: "string" }),
  selfIndexStandardAttribute({ names: { internal: "Parent", yaml: "Родитель" }, family: "sameOwnerObject" }),
  selfIndexStandardAttribute({ names: { internal: "IsFolder", yaml: "ЭтоГруппа" }, family: "primitive", kind: "boolean" }),
  selfIndexStandardAttribute({ names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", kind: "boolean" }),
  selfIndexStandardAttribute({ names: { internal: "Predefined", yaml: "Предопределенный" }, family: "primitive", kind: "boolean" }),
  selfIndexStandardAttribute({ names: { internal: "PredefinedDataName", yaml: "ИмяПредопределенныхДанных" }, family: "primitive", kind: "string" }),
] as const satisfies readonly StandardMemberDeclaration[]

export const metadataChartOfCharacteristicTypesStandardMemberRules: readonly DataPathContribution[] = [
  { kind: "standardMembers", ownerKind: "ПланВидовХарактеристик", members },
  { kind: "standardMembers", ownerKind: "ПланВидовХарактеристикОбъект", members },
]
