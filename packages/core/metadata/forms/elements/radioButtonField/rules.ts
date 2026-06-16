import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const RadioButtonFieldRules = {
  itemType: "RadioButtonField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.RadioButtonField",
  properties: {
    backColor: { yaml: "ЦветФона", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    choiceList: {
      yaml: "СписокВыбора",
      type: "ChoiceList",
      toEnterprise: false,
    },
    columnsCount: { yaml: "КоличествоКолонок", type: "number" },
    equalColumnsWidth: { yaml: "ОдинаковаяШиринаКолонок", type: "boolean" },
    font: { yaml: "Шрифт", type: "Font", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] } },
    itemHeight: { yaml: "ВысотаЭлемента", type: "number" },
    itemTitleHeight: { yaml: "ВысотаЗаголовкаЭлемента", type: "number" },
    itemWidth: { yaml: "ШиринаЭлемента", type: "number" },
    radioButtonType: {
      yaml: "ВидПереключателя",
      type: "SystemEnumeration",
      typeSE: "RadioButtonType",
    },
    textColor: { yaml: "ЦветТекста", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
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
    ...formFieldDisabledTableRelatedProperties,
  },
} as const satisfies ElementRule

registerElementRule("RadioButtonField", RadioButtonFieldRules)
