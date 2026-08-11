import { selfIndexStandardAttribute, type StandardMemberDeclaration } from "../../standardMembers/declarations"
import type { DataPathContribution } from "../../validation/dataPath/registry"

const members = [
  selfIndexStandardAttribute({ names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject" }),
  selfIndexStandardAttribute({ names: { internal: "Code", yaml: "Код" }, family: "primitive", kind: "string" }),
  selfIndexStandardAttribute({ names: { internal: "Description", yaml: "Наименование" }, family: "primitive", kind: "string" }),
  selfIndexStandardAttribute({ names: { internal: "Parent", yaml: "Родитель" }, family: "sameOwnerObject" }),
  selfIndexStandardAttribute({ names: { internal: "Type", yaml: "Вид" }, family: "standardEnum", name: "ВидСчета" }),
  selfIndexStandardAttribute({ names: { internal: "OffBalance", yaml: "Забалансовый" }, family: "primitive", kind: "boolean" }),
  selfIndexStandardAttribute({ names: { internal: "Order", yaml: "Порядок" }, family: "primitive", kind: "string" }),
  selfIndexStandardAttribute({ names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", kind: "boolean" }),
  selfIndexStandardAttribute({ names: { internal: "Predefined", yaml: "Предопределенный" }, family: "primitive", kind: "boolean" }),
  selfIndexStandardAttribute({ names: { internal: "PredefinedDataName", yaml: "ИмяПредопределенныхДанных" }, family: "primitive", kind: "string" }),
  {
    memberKind: "standardTabularSection",
    names: { internal: "ExtDimensionTypes", yaml: "ВидыСубконто" },
    family: "standardTable",
    phase: "traversal-time",
    sourceScope: "ownerModel",
    tableKind: "ValueTable",
    columns: [
      { memberKind: "standardTabularSectionColumn", names: { internal: "ExtDimensionType", yaml: "ВидСубконто" }, family: "objectRefFromOwnerProperty", property: "extDimensionTypes" },
      { memberKind: "standardTabularSectionColumn", names: { internal: "TurnoversOnly", yaml: "ТолькоОбороты" }, family: "primitive", kind: "boolean" },
      { memberKind: "standardTabularSectionColumn", names: { internal: "ТолькоСальдо", yaml: "ТолькоСальдо" }, family: "primitive", kind: "boolean" },
      { memberKind: "standardTabularSectionColumn", names: { internal: "*", yaml: "*" }, family: "primitive", kind: "boolean", discoveredFrom: "extDimensionAccountingFlags" },
    ],
  },
] as const satisfies readonly StandardMemberDeclaration[]

export const metadataChartOfAccountsStandardMemberRules: readonly DataPathContribution[] = [
  { kind: "standardMembers", ownerKind: "ПланСчетов", members },
  { kind: "standardMembers", ownerKind: "ПланСчетовОбъект", members },
]
