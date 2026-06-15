import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formGroupCommonProperties } from "../formGroup/rules"
export type { ElementRule, PropertyRule }

export const ColumnGroupRules = {
  itemType: "ColumnGroup",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.ColumnGroup",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    childItems: { yaml: "Элементы", type: "TableChildItems", defaultValue: [] },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    },
    fixingInTable: {
      yaml: "ФиксацияВТаблице",
      type: "SystemEnumeration",
      typeSE: "FixingInTable",
      implicitValueYAML: "None",
    },
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ColumnsGroup",
      defaultValue: "Vertical",
      required: true,
      implicitValueYAML: "Вертикальная",
    },
    headerDataPath: { yaml: "ПутьКДаннымШапки", type: "DataPath", defaultType: "string" },
    headerFormat: { yaml: "ФорматШапки", type: "I8nText" },
    headerHorizontalAlign: {
      yaml: "ГоризонтальноеПоложениеВШапке",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      implicitValueYAML: "Auto",
    },
    headerPicture: { yaml: "КартинкаШапки", type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] } },
    showInHeader: { yaml: "ОтображатьВШапке", type: "boolean" },
    showTitle: { yaml: "ОтображатьЗаголовок", type: "boolean" },
    titleBackColor: { yaml: "ЦветФонаЗаголовка", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    ...formGroupCommonProperties,
    shortcut: {
      ...formGroupCommonProperties.shortcut,
      toYAML: false,
      fromYAML: false,
    },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
      runtimeOnly: true,
      implicitValueYAML: "ColumnGroup",
    },
  },
} as const satisfies ElementRule

registerElementRule("ColumnGroup", ColumnGroupRules)
