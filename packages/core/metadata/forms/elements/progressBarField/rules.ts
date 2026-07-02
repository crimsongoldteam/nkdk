import { colorRule } from "~/metadata/commonObjects/color/types"
import { dataPathRule } from "~/metadata/commonObjects/metadataPath/types"
import { eventsRule } from "~/metadata/forms/commonObjects/event/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const ProgressBarFieldRules = {
  itemType: "ProgressBarField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.ProgressBarField",
  properties: {
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 1 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: true }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxValue: numberRule({ yaml: "МаксимальноеЗначение", implicitValueYAML: 100 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    minValue: numberRule({ yaml: "МинимальноеЗначение", implicitValueYAML: 0 }),
    orientation: systemEnumerationRule({
      yaml: "Ориентация",
      typeSE: "FormItemOrientation",
      implicitValueYAML: "Horizontal",
    }),
    representation: systemEnumerationRule({
      yaml: "Отображение",
      typeSE: "ProgressBarSmoothingMode",
      implicitValueYAML: "Smooth",
    }),
    showPercent: booleanRule({ yaml: "ОтображатьПроценты", implicitValueYAML: false }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", implicitValueYAML: false }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 32 }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      toYAML: false,
      fromYAML: false,
      defaultType: "decimal",
    }),
    ...formFieldCommonProperties,
    ...formFieldDisabledTableRelatedProperties,
    titleHeight: {
      ...formFieldCommonProperties.titleHeight,
      implicitValueYAML: 0,
    },
  },
} as const satisfies ElementRule
registerElementRule("ProgressBarField", ProgressBarFieldRules)
