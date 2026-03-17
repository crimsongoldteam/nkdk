import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

const CheckBoxFieldCommonRulesProperties = {
  backColor: { yaml: "ЦветФона", type: "Color" },
  borderColor: { yaml: "ЦветРамки", type: "Color" },
  checkBoxType: {
    yaml: "ВидФлажка",
    type: "SystemEnumeration",
    typeSE: "CheckBoxType",
    defaultValueYAML: "Auto",
  },
  editFormat: { yaml: "ФорматРедактирования", type: "I8nText" },
  equalItemsWidth: { yaml: "ОдинаковаяШиринаЭлементов", type: "boolean" },
  font: { yaml: "Шрифт", type: "Font" },
  itemHeight: { yaml: "ВысотаЭлемента", type: "number" },
  itemTitleHeight: { yaml: "ВысотаЗаголовкаЭлемента", type: "number" },
  itemWidth: { yaml: "ШиринаЭлемента", type: "number" },
  textColor: { yaml: "ЦветТекста", type: "Color" },
  threeState: { yaml: "ТриСостояния", type: "boolean" },
  events: {
    type: "Events",
    yaml: "События",
    toEnterprise: false,
    items: {
      onChange: "ПриИзменении",
    },
  },
  dataPath: {
    yaml: "ПутьКДанным",
    type: "DataPath",
    toYAML: false,
    fromYAML: false,
    defaultType: "boolean",
  },
  ...formFieldCommonProperties,
} as const satisfies MetadataItemRule["properties"]

export const CheckBoxFieldRules = {
  itemType: "CheckBoxField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.CheckBoxField",
  properties: {
    ...CheckBoxFieldCommonRulesProperties,
  },
} as const satisfies ElementRule

export const TableCheckBoxFieldRules = {
  itemType: "TableCheckBoxField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.CheckBoxField",
  properties: {
    ...CheckBoxFieldCommonRulesProperties,
    ...formFieldTableRelatedProperties,
  },
} as const satisfies ElementRule

registerElementRule("CheckBoxField", CheckBoxFieldRules)
registerElementRule("TableCheckBoxField", TableCheckBoxFieldRules)
