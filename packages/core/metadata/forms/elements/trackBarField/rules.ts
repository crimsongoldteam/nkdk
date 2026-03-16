import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const TrackBarFieldRules = {
  itemType: "TrackBarField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.TrackBarField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    largeStep: { yaml: "БольшойШаг", type: "number" },
    markingAppearance: {
      yaml: "ОтображениеРазметки",
      type: "SystemEnumeration",
      typeSE: "TrackBarMarkingAppearance",
    },
    markingStep: { yaml: "ШагРазметки", type: "number" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxValue: { yaml: "МаксимальноеЗначение", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    minValue: { yaml: "МинимальноеЗначение", type: "number" },
    orientation: {
      yaml: "Ориентация",
      type: "SystemEnumeration",
      typeSE: "FormItemOrientation",
    },
    step: { yaml: "Шаг", type: "number" },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
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

registerElementRule("TrackBarField", TrackBarFieldRules)
