import { dataPathRule } from "~/metadata/commonObjects/metadataPath/types"
import { eventsRule } from "~/metadata/forms/commonObjects/event/types"
import { ganttChartFieldTableRule } from "~/metadata/forms/commonObjects/ganttChartFieldTable/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const GanttChartFieldRules = {
  itemType: "GanttChartField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.GanttChartField",
  properties: {
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 10 }),
    horizontalLines: booleanRule({
      yaml: "ГоризонтальныеЛинии",
      xml: "ShowHorizontalLinesFlag",
      noImplicitValueYAML: true,
    }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: true }),
    intervalsSelectionMode: systemEnumerationRule({
      yaml: "РежимВыделенияИнтервалов",
      typeSE: "GanttChartIntervalsSelectionMode",
      implicitValueYAML: "Auto",
    }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    tableLocation: systemEnumerationRule({
      yaml: "ПоложениеТаблицы",
      typeSE: "GanttChartTableLocation",
      implicitValueYAML: "Auto",
    }),
    table: ganttChartFieldTableRule({
      yaml: "Таблица",
      xml: "Table",
      toEnterprise: false,
    }),
    valuesSelectionMode: systemEnumerationRule({
      yaml: "РежимВыделенияЗначений",
      typeSE: "GanttChartValuesSelectionMode",
      implicitValueYAML: "Auto",
    }),
    verticalLines: booleanRule({ yaml: "ВертикальныеЛинии", xml: "ShowVerticalLinesFlag", noImplicitValueYAML: true }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", implicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 50 }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        selection: "Выбор",
        detailProcessing: "ОбработкаРасшифровки",
        beforeExpand: "ПередРазворачиванием",
        beforeCollapse: "ПередСворачиванием",
        onActivateValue: "ПриАктивизацииЗначения",
        onActivateInterval: "ПриАктивизацииИнтервала",
        onIntervalEditEnd: "ПриОкончанииРедактированияИнтервала",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      toYAML: false,
      fromYAML: false,
      defaultType: "GanttChart",
    }),
    ...formFieldCommonProperties,
    titleHeight: { ...formFieldCommonProperties.titleHeight, implicitValueYAML: 0 },
  },
} as const satisfies ElementRule
registerElementRule("GanttChartField", GanttChartFieldRules)
