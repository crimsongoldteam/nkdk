import { borderRule } from "../../../commonObjects/border/types"
import { colorRule } from "../../../commonObjects/color/types"
import { fontRule } from "../../../commonObjects/font/types"
import { dataPathRule } from "../../../commonObjects/metadataPath/types"
import { eventsRule } from "../../commonObjects/event/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { registerElementRule } from "../../../orchestration/formElement/ruleFactory"
import type { PropertyRule } from "../../../orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const PeriodFieldRules = {
  itemType: "PeriodField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.PeriodField",
  properties: {
    font: fontRule({
      yaml: "Шрифт",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    }),
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    border: borderRule({
      yaml: "Рамка",
      implicitValueYAML: "Single",
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
    height: numberRule({ yaml: "Высота", implicitValueYAML: 0 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", noImplicitValueYAML: true }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", noImplicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 0 }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        selection: "Выбор",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      defaultType: "dateTime",
    }),
    ...formFieldCommonProperties,
    ...formFieldDisabledTableRelatedProperties,
    titleHeight: numberRule({ yaml: "ВысотаЗаголовка", implicitValueYAML: 0 }),
  },
} as const satisfies ElementRule
registerElementRule("PeriodField", PeriodFieldRules)
