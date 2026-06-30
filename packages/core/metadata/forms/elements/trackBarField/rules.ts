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
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean", implicitValueYAML: true },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", implicitValueYAML: true },
    height: { yaml: "Высота", type: "number", implicitValueYAML: 2 },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", implicitValueYAML: true },
    largeStep: { yaml: "БольшойШаг", type: "number", implicitValueYAML: 10 },
    markingAppearance: {
      yaml: "ОтображениеРазметки",
      type: "SystemEnumeration",
      typeSE: "TrackBarMarkingAppearance",
      implicitValueYAML: "BottomRight",
    },
    markingStep: { yaml: "ШагРазметки", type: "number", implicitValueYAML: 5 },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number", implicitValueYAML: 0 },
    maxValue: { yaml: "МаксимальноеЗначение", type: "number", implicitValueYAML: 100 },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
    minValue: { yaml: "МинимальноеЗначение", type: "number", implicitValueYAML: 0 },
    orientation: {
      yaml: "Ориентация",
      type: "SystemEnumeration",
      typeSE: "FormItemOrientation",
      implicitValueYAML: "Horizontal",
    },
    step: { yaml: "Шаг", type: "number", implicitValueYAML: 1 },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean", implicitValueYAML: false },
    width: { yaml: "Ширина", type: "number", implicitValueYAML: 32 },
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
      defaultType: "decimal",
    },
    ...formFieldCommonProperties,
    ...formFieldDisabledTableRelatedProperties,
  },
} as const satisfies ElementRule

registerElementRule("TrackBarField", TrackBarFieldRules)
