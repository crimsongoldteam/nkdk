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
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxValue: { yaml: "МаксимальноеЗначение", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 100 },
    minValue: { yaml: "МинимальноеЗначение", type: "number", implicitValueYAML: 0 },
    orientation: {
      yaml: "Ориентация",
      type: "SystemEnumeration",
      typeSE: "FormItemOrientation",
    },
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "ProgressBarSmoothingMode",
    },
    showPercent: { yaml: "ОтображатьПроценты", type: "boolean" },
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
      defaultType: "decimal",
    },
    ...formFieldCommonProperties,
    ...formFieldDisabledTableRelatedProperties,
  },
} as const satisfies ElementRule

registerElementRule("ProgressBarField", ProgressBarFieldRules)
