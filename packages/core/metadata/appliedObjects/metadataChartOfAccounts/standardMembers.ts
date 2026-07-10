import { registerStandardMembers, type StandardMemberDeclaration } from "../../validation/dataPath/registry"

const members = [
  { memberKind: "standardAttribute", names: { internal: "Ref", yaml: "Ссылка" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Code", yaml: "Код" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
  { memberKind: "standardAttribute", names: { internal: "Description", yaml: "Наименование" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
  { memberKind: "standardAttribute", names: { internal: "Parent", yaml: "Родитель" }, family: "sameOwnerObject", phase: "index-time", sourceScope: "self" },
  { memberKind: "standardAttribute", names: { internal: "Type", yaml: "Вид" }, family: "standardEnum", phase: "index-time", sourceScope: "self", name: "ВидСчета" },
  { memberKind: "standardAttribute", names: { internal: "OffBalance", yaml: "Забалансовый" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "Order", yaml: "Порядок" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
  { memberKind: "standardAttribute", names: { internal: "DeletionMark", yaml: "ПометкаУдаления" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "Predefined", yaml: "Предопределенный" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "boolean" },
  { memberKind: "standardAttribute", names: { internal: "PredefinedDataName", yaml: "ИмяПредопределенныхДанных" }, family: "primitive", phase: "index-time", sourceScope: "self", kind: "string" },
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

registerStandardMembers("ПланСчетов", members)
registerStandardMembers("ПланСчетовОбъект", members)
