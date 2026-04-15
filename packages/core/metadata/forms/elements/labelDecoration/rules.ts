import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formDecorationCommonProperties } from "../formDecoration/rules"
export type { ElementRule, PropertyRule }

export const LabelDecorationRules = {
  itemType: "LabelDecoration",
  enterpriseField: "FormDecoration",
  enterpriseFieldType: "FormDecorationType.Label",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    title: {
      yaml: "Заголовок",
      type: "FormattedI8nText",
      yamlFormatted: "ФорматированныйЗаголовок",
      yamlPartialOthers: true,
    },
    type: {
      type: "SystemEnumeration",
      typeSE: "FormDecorationType",
      runtimeOnly: true,
    },
    ...formDecorationCommonProperties,
    backColor: { yaml: "ЦветФона", type: "Color" },
    border: { yaml: "Рамка", type: "Border" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    horizontalAlign: {
      yaml: "ГоризонтальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    hyperlink: { yaml: "Гиперссылка", type: "boolean" },
    titleHeight: { yaml: "ВысотаЗаголовка", type: "number" },
    verticalAlign: {
      yaml: "ВертикальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        click: "Нажатие",
        uRLProcessing: "ОбработкаНавигационнойСсылки",
      },
    },
  },
} as const satisfies ElementRule

registerElementRule("LabelDecoration", LabelDecorationRules)
