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
      defaultValueYAML: "Auto",
    },
    fixingInTable: {
      yaml: "ФиксацияВТаблице",
      type: "SystemEnumeration",
      typeSE: "FixingInTable",
      defaultValueYAML: "None",
    },
    group: {
      yaml: "Группировка",
      type: "SystemEnumeration",
      typeSE: "ColumnsGroup",
      defaultValue: "Vertical",
      required: true,
      defaultValueYAML: "Вертикальная",
    },
    headerDataPath: { yaml: "ПутьКДаннымШапки", type: "DataPath", defaultType: "string" },
    headerFormat: { yaml: "ФорматШапки", type: "I8nText" },
    headerHorizontalAlign: {
      yaml: "ГоризонтальноеПоложениеВШапке",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      defaultValueYAML: "Auto",
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
      defaultValueYAML: "ColumnGroup",
    },
  },
} as const satisfies ElementRule

registerElementRule("ColumnGroup", ColumnGroupRules)
