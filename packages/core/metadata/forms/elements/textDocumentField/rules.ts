import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const TextDocumentFieldRules = {
  itemType: "TextDocumentField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.TextDocumentField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    backColor: { yaml: "ЦветФона", type: "Color" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    font: { yaml: "Шрифт", type: "Font" },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    output: {
      yaml: "Вывод",
      type: "SystemEnumeration",
      typeSE: "UseOutput",
    },
    selectedText: { yaml: "ВыделенныйТекст", type: "string" },
    textColor: { yaml: "ЦветТекста", type: "Color" },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        beforeWrite: "ПередЗаписью",
        beforePrint: "ПередПечатью",
        afterWrite: "ПослеЗаписи",
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

registerElementRule("TextDocumentField", TextDocumentFieldRules)
