import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const CheckBoxFieldRules = {
  itemType: "CheckBoxField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.CheckBoxField",
  properties: {
    ...formFieldCommonProperties,
    backColor: { yaml: "ЦветФона", type: "Color" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    checkBoxType: {
      yaml: "ВидФлажка",
      type: "SystemEnumeration",
      typeSE: "CheckBoxType",
    },
    editFormat: { yaml: "ФорматРедактирования", type: "I8nText" },
    equalItemsWidth: { yaml: "ОдинаковаяШиринаЭлементов", type: "boolean" },
    font: { yaml: "Шрифт", type: "Font" },
    itemHeight: { yaml: "ВысотаЭлемента", type: "number" },
    itemTitleHeight: { yaml: "ВысотаЗаголовкаЭлемента", type: "number" },
    itemWidth: { yaml: "ШиринаЭлемента", type: "number" },
    textColor: { yaml: "ЦветТекста", type: "Color" },
    threeState: { yaml: "ТриСостояния", type: "boolean" },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
      toEnterprise: false,
    },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
      },
    },
  },
} as const satisfies ElementRule

registerElementRule("CheckBoxField", CheckBoxFieldRules)
