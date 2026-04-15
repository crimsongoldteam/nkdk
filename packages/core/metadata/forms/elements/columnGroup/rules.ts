import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
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
    childItems: { type: "TableChildItems", defaultValue: [] },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    fixingInTable: {
      yaml: "ФиксацияВТаблице",
      type: "SystemEnumeration",
      typeSE: "FixingInTable",
    },
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ColumnsGroup",
      defaultValue: "Vertical",
      toPartialYAML: false,
      required: true,
    },
    headerDataPath: { yaml: "ПутьКДаннымШапки", type: "DataPath", defaultType: "string" },
    headerFormat: { yaml: "ФорматШапки", type: "string" },
    headerHorizontalAlign: {
      yaml: "ГоризонтальноеПоложениеВШапке",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    headerPicture: { yaml: "КартинкаШапки", type: "Picture" },
    showInHeader: { yaml: "ОтображатьВШапке", type: "boolean" },
    showTitle: { yaml: "ОтображатьЗаголовок", type: "boolean" },
    titleBackColor: { yaml: "ЦветФонаЗаголовка", type: "Color" },
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
    },
  },
} as const satisfies ElementRule

registerElementRule("ColumnGroup", ColumnGroupRules)
