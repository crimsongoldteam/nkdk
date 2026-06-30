import { dataPathRule } from "~/metadata/commonObjects/metadataPath/types"
import { eventsRule } from "~/metadata/forms/commonObjects/event/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const TrackBarFieldRules = {
  itemType: "TrackBarField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.TrackBarField",
  properties: {
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 2 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: true }),
    largeStep: numberRule({ yaml: "БольшойШаг", implicitValueYAML: 10 }),
    markingAppearance: systemEnumerationRule({
      yaml: "ОтображениеРазметки",
      typeSE: "TrackBarMarkingAppearance",
      implicitValueYAML: "BottomRight",
    }),
    markingStep: numberRule({ yaml: "ШагРазметки", implicitValueYAML: 5 }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxValue: numberRule({ yaml: "МаксимальноеЗначение", implicitValueYAML: 100 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    minValue: numberRule({ yaml: "МинимальноеЗначение", implicitValueYAML: 0 }),
    orientation: systemEnumerationRule({
      yaml: "Ориентация",
      typeSE: "FormItemOrientation",
      implicitValueYAML: "Horizontal",
    }),
    step: numberRule({ yaml: "Шаг", implicitValueYAML: 1 }),
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
  },
} as const satisfies ElementRule
registerElementRule("TrackBarField", TrackBarFieldRules)
