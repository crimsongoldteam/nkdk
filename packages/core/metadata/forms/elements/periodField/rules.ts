import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const PeriodFieldRules = {
  itemType: "PeriodField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.PeriodField",
  properties: {
    font: { yaml: "Шрифт", type: "Font", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] } },
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean", implicitValueYAML: true },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", implicitValueYAML: true },
    border: { yaml: "Рамка", type: "Border", implicitValueYAML: "Single", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Border"] }] } },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    height: { yaml: "Высота", type: "number", implicitValueYAML: 0 },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", noImplicitValueYAML: true },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number", implicitValueYAML: 0 },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean", noImplicitValueYAML: true },
    width: { yaml: "Ширина", type: "number", implicitValueYAML: 0 },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        selection: "Выбор",
      },
    },
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      toYAML: false,
      fromYAML: false,
      defaultType: "dateTime",
    },
    ...formFieldCommonProperties,
    ...formFieldDisabledTableRelatedProperties,
    titleHeight: { yaml: "ВысотаЗаголовка", type: "number", implicitValueYAML: 0 },
  },
} as const satisfies ElementRule

registerElementRule("PeriodField", PeriodFieldRules)
