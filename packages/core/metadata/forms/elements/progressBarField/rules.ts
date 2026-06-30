import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const ProgressBarFieldRules = {
  itemType: "ProgressBarField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.ProgressBarField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean", implicitValueYAML: true },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", implicitValueYAML: true },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    height: { yaml: "Высота", type: "number", implicitValueYAML: 1 },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", implicitValueYAML: true },
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
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "ProgressBarSmoothingMode",
      implicitValueYAML: "Smooth",
    },
    showPercent: { yaml: "ОтображатьПроценты", type: "boolean", implicitValueYAML: false },
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
    titleHeight: {
      ...formFieldCommonProperties.titleHeight,
      implicitValueYAML: 0,
    },
  },
} as const satisfies ElementRule

registerElementRule("ProgressBarField", ProgressBarFieldRules)
