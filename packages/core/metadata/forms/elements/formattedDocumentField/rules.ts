import { colorRule } from "~/metadata/commonObjects/color/types"
import { fontRule } from "~/metadata/commonObjects/font/types"
import { dataPathRule } from "~/metadata/commonObjects/metadataPath/types"
import { commandSetRule } from "~/metadata/forms/commonObjects/commandSet/types"
import { eventsRule } from "~/metadata/forms/commonObjects/event/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const FormattedDocumentFieldRules = {
  itemType: "FormattedDocumentField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.FormattedDocumentField",
  properties: {
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    backColor: colorRule({
      yaml: "ЦветФона",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    commandSet: commandSetRule({ yaml: "Команда", toEnterprise: false }),
    font: fontRule({
      yaml: "Шрифт",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 10 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: true }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    output: systemEnumerationRule({
      yaml: "Вывод",
      typeSE: "UseOutput",
      implicitValueYAML: "Auto",
    }),
    selectedText: stringRule({
      yaml: "ВыделенныйТекст",
      runtimeOnly: true,
    }),
    textColor: colorRule({
      yaml: "ЦветТекста",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", implicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 50 }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        beforeWrite: "ПередЗаписью",
        beforePrint: "ПередПечатью",
        afterWrite: "ПослеЗаписи",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      toYAML: false,
      fromYAML: false,
      defaultType: "string",
    }),
    ...formFieldCommonProperties,
    titleHeight: { ...formFieldCommonProperties.titleHeight, implicitValueYAML: 0 },
  },
} as const satisfies ElementRule
registerElementRule("FormattedDocumentField", FormattedDocumentFieldRules)
