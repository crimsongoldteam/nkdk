import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const HTMLDocumentFieldRules = {
  itemType: "HTMLDocumentField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.HTMLDocumentField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    output: {
      yaml: "Вывод",
      type: "SystemEnumeration",
      typeSE: "UseOutput",
      implicitValueYAML: "Auto",
    },
    userAgentInformation: {
      yaml: "ИнформацияПрограммыПросмотра",
      type: "string",
      runtimeOnly: true,
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        documentComplete: "ДокументСформирован",
        beforeWrite: "ПередЗаписью",
        beforePrint: "ПередПечатью",
        afterWrite: "ПослеЗаписи",
        onClick: "ПриНажатии",
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
    ...formFieldDisabledTableRelatedProperties,
  },
} as const satisfies ElementRule

registerElementRule("HTMLDocumentField", HTMLDocumentFieldRules)
