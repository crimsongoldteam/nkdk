import { borderRule } from "~/metadata/commonObjects/border/types"
import { colorRule } from "~/metadata/commonObjects/color/types"
import { fontRule } from "~/metadata/commonObjects/font/types"
import { dataPathRule } from "~/metadata/commonObjects/metadataPath/types"
import { eventsRule } from "~/metadata/forms/commonObjects/event/types"
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
    backColor: colorRule({
      yaml: "ЦветФона",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    border: borderRule({
      yaml: "Рамка",
      implicitValueYAML: "WithoutBorder",
      metadataTarget: {
        kind: "object",
        roots: ["StyleItem"],
        filters: [{ kind: "styleItemType", values: ["Border"] }],
      },
    }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    font: fontRule({
      yaml: "Шрифт",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    }),
    format: i8nTextRule({ yaml: "Формат" }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 0 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", noImplicitValueYAML: true }),
    hyperlink: booleanRule({ yaml: "Гиперссылка", xml: "Hiperlink", implicitValueYAML: false }),
    markNegatives: booleanRule({ yaml: "ВыделятьОтрицательные", noImplicitValueYAML: true }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    passwordMode: booleanRule({ yaml: "РежимПароля", noImplicitValueYAML: true }),
    textColor: colorRule({
      yaml: "ЦветТекста",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", noImplicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 0 }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        click: "Нажатие",
        uRLProcessing: "ОбработкаНавигационнойСсылки",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      defaultType: "string",
    }),
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
