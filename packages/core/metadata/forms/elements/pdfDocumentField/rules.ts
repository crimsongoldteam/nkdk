import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const PDFDocumentFieldRules = {
  itemType: "PDFDocumentField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.PDFDocumentField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    commandSet: { yaml: "Команда", type: "CommandSet", toEnterprise: false },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number", implicitValueYAML: 0 },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
    output: {
      yaml: "Вывод",
      type: "SystemEnumeration",
      typeSE: "UseOutput",
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    viewStatusRepresentation: {
      yaml: "ОтображениеСостоянияПросмотра",
      type: "SingleViewStatusAddition",
      xml: "ViewStatusAddition",
      toEnterprise: false,
    },
    viewStatusLocation: {
      yaml: "ПоложениеСостоянияПросмотра",
      type: "SystemEnumeration",
      typeSE: "ViewStatusLocation",
    },
    width: { yaml: "Ширина", type: "number" },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        uRLClick: "НажатиеНаНавигационнойСсылке",
      },
    },
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      toYAML: false,
      fromYAML: false,
      defaultType: "PDFDocument",
    },
    ...formFieldCommonProperties,
  },
} as const satisfies ElementRule

registerElementRule("PDFDocumentField", PDFDocumentFieldRules)
