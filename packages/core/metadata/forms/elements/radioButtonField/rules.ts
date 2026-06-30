import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
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
    backColor: {
      yaml: "ЦветФона",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    borderColor: {
      yaml: "ЦветРамки",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    choiceList: {
      yaml: "СписокВыбора",
      type: "ChoiceList",
      toEnterprise: false,
    },
    columnsCount: numberRule({ yaml: "КоличествоКолонок", implicitValueYAML: 0 }),
    equalColumnsWidth: booleanRule({ yaml: "ОдинаковаяШиринаКолонок", noImplicitValueYAML: true }),
    font: {
      yaml: "Шрифт",
      type: "Font",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    },
    itemHeight: numberRule({ yaml: "ВысотаЭлемента", implicitValueYAML: 0 }),
    itemTitleHeight: numberRule({ yaml: "ВысотаЗаголовкаЭлемента", implicitValueYAML: 0 }),
    itemWidth: numberRule({ yaml: "ШиринаЭлемента", implicitValueYAML: 0 }),
    radioButtonType: systemEnumerationRule({
      yaml: "ВидПереключателя",
      typeSE: "RadioButtonType",
      implicitValueYAML: "Auto",
    }),
    textColor: {
      yaml: "ЦветТекста",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
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
    titleHeight: {
      ...formFieldCommonProperties.titleHeight,
      implicitValueYAML: 0,
    },
  },
} as const satisfies ElementRule
registerElementRule("RadioButtonField", RadioButtonFieldRules)
