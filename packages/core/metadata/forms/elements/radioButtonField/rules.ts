import { choiceListRule } from "../../../commonObjects/choiceList/types"
import { colorRule } from "../../../commonObjects/color/types"
import { fontRule } from "../../../commonObjects/font/types"
import { dataPathRule } from "../../../commonObjects/metadataPath/types"
import { eventsRule } from "../../commonObjects/event/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { registerElementRule } from "../../../orchestration/formElement/ruleFactory"
import type { PropertyRule } from "../../../orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const RadioButtonFieldRules = {
  itemType: "RadioButtonField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.RadioButtonField",
  properties: {
    backColor: colorRule({
      yaml: "ЦветФона",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    choiceList: choiceListRule({
      yaml: "СписокВыбора",
      toEnterprise: false,
    }),
    columnsCount: numberRule({ yaml: "КоличествоКолонок", implicitValueYAML: 0 }),
    equalColumnsWidth: booleanRule({ yaml: "ОдинаковаяШиринаКолонок", noImplicitValueYAML: true }),
    font: fontRule({
      yaml: "Шрифт",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    }),
    itemHeight: numberRule({ yaml: "ВысотаЭлемента", implicitValueYAML: 0 }),
    itemTitleHeight: numberRule({ yaml: "ВысотаЗаголовкаЭлемента", implicitValueYAML: 0 }),
    itemWidth: numberRule({ yaml: "ШиринаЭлемента", implicitValueYAML: 0 }),
    radioButtonType: systemEnumerationRule({
      yaml: "ВидПереключателя",
      typeSE: "RadioButtonType",
      implicitValueYAML: "Auto",
    }),
    textColor: colorRule({
      yaml: "ЦветТекста",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      defaultType: "string",
    }),
    ...formFieldCommonProperties,
    ...formFieldDisabledTableRelatedProperties,
    titleHeight: {
      ...formFieldCommonProperties.titleHeight,
      implicitValueYAML: 0,
    },
  },
} as const satisfies ElementRule
registerElementRule("RadioButtonField", RadioButtonFieldRules)
