import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const RadioButtonFieldRules = {
  itemType: "RadioButtonField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.RadioButtonField",
  properties: {
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
      defaultType: "string",
    },
    ...formFieldCommonProperties,
    ...formFieldTableRelatedProperties,
  },
} as const satisfies ElementRule

registerElementRule("RadioButtonField", RadioButtonFieldRules)
