import { colorRule } from "~/metadata/commonObjects/color/types"
import { dataPathRule } from "~/metadata/commonObjects/metadataPath/types"
import { commandSetRule } from "~/metadata/forms/commonObjects/commandSet/types"
import { eventsRule } from "~/metadata/forms/commonObjects/event/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const GraphicalSchemaFieldRules = {
  itemType: "GraphicalSchemaField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.GraphicalSchemaField",
  properties: {
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    commandSet: commandSetRule({ yaml: "Команда", toEnterprise: false }),
    edit: booleanRule({ yaml: "Редактирование", toYAML: false, fromYAML: false, toEnterprise: false }),
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
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 50 }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        selection: "Выбор",
        beforeWrite: "ПередЗаписью",
        beforePrint: "ПередПечатью",
        afterWrite: "ПослеЗаписи",
        onActivate: "ПриАктивизации",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      toYAML: false,
      fromYAML: false,
      defaultType: "FlowchartContextType",
    }),
    ...formFieldCommonProperties,
    titleHeight: { ...formFieldCommonProperties.titleHeight, implicitValueYAML: 0 },
    ...formFieldDisabledTableRelatedProperties,
  },
} as const satisfies ElementRule
registerElementRule("GraphicalSchemaField", GraphicalSchemaFieldRules)
