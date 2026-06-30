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
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean", implicitValueYAML: true },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", implicitValueYAML: true },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    commandSet: { yaml: "Команда", type: "CommandSet", toEnterprise: false },
    height: { yaml: "Высота", type: "number", implicitValueYAML: 10 },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", implicitValueYAML: true },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number", implicitValueYAML: 0 },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
    output: {
      yaml: "Вывод",
      type: "SystemEnumeration",
      typeSE: "UseOutput",
      implicitValueYAML: "Auto",
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean", implicitValueYAML: true },
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
      implicitValueYAML: "Auto",
    },
    width: { yaml: "Ширина", type: "number", implicitValueYAML: 50 },
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
    titleHeight: {
      ...formFieldCommonProperties.titleHeight,
      implicitValueYAML: 0,
    },
  },
} as const satisfies ElementRule

registerElementRule("PDFDocumentField", PDFDocumentFieldRules)
