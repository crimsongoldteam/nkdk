import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const RadioButtonFieldRules = {
  itemType: "RadioButtonField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.RadioButtonField",
  properties: {
    ...formFieldCommonProperties,
    backColor: { yaml: "ЦветФона", type: "Color" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    choiceList: {
      yaml: "СписокВыбора",
      type: "ChoiceList",
      toEnterprise: false,
    },
    columnsCount: { yaml: "КоличествоКолонок", type: "number" },
    equalColumnsWidth: { yaml: "ОдинаковаяШиринаКолонок", type: "boolean" },
    font: { yaml: "Шрифт", type: "Font" },
    itemHeight: { yaml: "ВысотаЭлемента", type: "number" },
    itemTitleHeight: { yaml: "ВысотаЗаголовкаЭлемента", type: "number" },
    itemWidth: { yaml: "ШиринаЭлемента", type: "number" },
    radioButtonType: {
      yaml: "ВидПереключателя",
      type: "SystemEnumeration",
      typeSE: "RadioButtonType",
    },
    textColor: { yaml: "ЦветТекста", type: "Color" },
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

registerElementRule("RadioButtonField", RadioButtonFieldRules)
