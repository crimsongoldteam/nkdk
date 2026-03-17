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
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    backColor: { yaml: "ЦветФона", type: "Color" },
    border: { yaml: "Рамка", type: "Border" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    font: { yaml: "Шрифт", type: "Font" },
    format: { yaml: "Формат", type: "I8nText" },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    hyperlink: { yaml: "Гиперссылка", type: "boolean", xml: "Hiperlink" },
    markNegatives: { yaml: "ВыделятьОтрицательные", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    passwordMode: { yaml: "РежимПароля", type: "boolean" },
    textColor: { yaml: "ЦветТекста", type: "Color" },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
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
      toPartialYAML: false,
      defaultType: "string",
    },
    ...formFieldCommonProperties,
  },
} as const satisfies ElementRule

export const TableLabelFieldRules = {
  itemType: "TableLabelField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.LabelField",
  properties: {
    ...LabelFieldRules.properties,
    ...formFieldTableRelatedProperties,
  },
} as const satisfies ElementRule

registerElementRule("LabelField", LabelFieldRules)
registerElementRule("TableLabelField", TableLabelFieldRules)
