import { colorRule } from "../../../commonObjects/color/types"
import { dataPathRule } from "../../../commonObjects/metadataPath/types"
import { commandSetRule } from "../../commonObjects/commandSet/types"
import { eventsRule } from "../../commonObjects/event/types"
import { singleViewStatusAdditionRule } from "./builders"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { registerElementRule } from "../../../orchestration/formElement/ruleFactory"
import type { PropertyRule } from "../../../orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const PDFDocumentFieldRules = {
  itemType: "PDFDocumentField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.PDFDocumentField",
  properties: {
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    commandSet: commandSetRule({ yaml: "Команда", toEnterprise: false }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 10 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: true }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    output: systemEnumerationRule({
      yaml: "Вывод",
      typeSE: "UseOutput",
      implicitValueYAML: "Auto",
    }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", implicitValueYAML: true }),
    viewStatusRepresentation: singleViewStatusAdditionRule({
      yaml: "ОтображениеСостоянияПросмотра",
      xml: "ViewStatusAddition",
      toEnterprise: false,
    }),
    viewStatusLocation: systemEnumerationRule({
      yaml: "ПоложениеСостоянияПросмотра",
      typeSE: "ViewStatusLocation",
      implicitValueYAML: "Auto",
    }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 50 }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        uRLClick: "НажатиеНаНавигационнойСсылке",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      toYAML: false,
      fromYAML: false,
      defaultType: "PDFDocument",
    }),
    ...formFieldCommonProperties,
    titleHeight: {
      ...formFieldCommonProperties.titleHeight,
      implicitValueYAML: 0,
    },
  },
} as const satisfies ElementRule
registerElementRule("PDFDocumentField", PDFDocumentFieldRules)
