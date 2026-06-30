import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const LabelFieldRules = {
  itemType: "LabelField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.LabelField",
  properties: {
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    backColor: {
      yaml: "ЦветФона",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    border: {
      yaml: "Рамка",
      type: "Border",
      implicitValueYAML: "WithoutBorder",
      metadataTarget: {
        kind: "object",
        roots: ["StyleItem"],
        filters: [{ kind: "styleItemType", values: ["Border"] }],
      },
    },
    borderColor: {
      yaml: "ЦветРамки",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    font: {
      yaml: "Шрифт",
      type: "Font",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    },
    format: i8nTextRule({ yaml: "Формат" }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 0 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", noImplicitValueYAML: true }),
    hyperlink: booleanRule({ yaml: "Гиперссылка", xml: "Hiperlink", implicitValueYAML: false }),
    markNegatives: booleanRule({ yaml: "ВыделятьОтрицательные", noImplicitValueYAML: true }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    passwordMode: booleanRule({ yaml: "РежимПароля", noImplicitValueYAML: true }),
    textColor: {
      yaml: "ЦветТекста",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", noImplicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 0 }),
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        click: "Нажатие",
        uRLProcessing: "ОбработкаНавигационнойСсылки",
      },
    },
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      defaultType: "string",
    },
    ...formFieldCommonProperties,
    titleHeight: numberRule({ yaml: "ВысотаЗаголовка", implicitValueYAML: 0 }),
  },
} as const satisfies ElementRule
export const TableLabelFieldRules = {
  itemType: "TableLabelField",
  xmlTag: "LabelField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.LabelField",
  properties: {
    ...LabelFieldRules.properties,
    ...formFieldTableRelatedProperties,
  },
} as const satisfies ElementRule
registerElementRule("LabelField", LabelFieldRules)
registerElementRule("TableLabelField", TableLabelFieldRules)
