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
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean", implicitValueYAML: true },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", implicitValueYAML: true },
    height: { yaml: "Высота", type: "number", implicitValueYAML: 10 },
    horizontalLines: { yaml: "ГоризонтальныеЛинии", xml: "ShowHorizontalLinesFlag", type: "boolean", noImplicitValueYAML: true },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", implicitValueYAML: true },
    intervalsSelectionMode: {
      yaml: "РежимВыделенияИнтервалов",
      type: "SystemEnumeration",
      typeSE: "GanttChartIntervalsSelectionMode",
      implicitValueYAML: "Auto",
    },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number", implicitValueYAML: 0 },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
    tableLocation: {
      yaml: "ПоложениеТаблицы",
      type: "SystemEnumeration",
      typeSE: "GanttChartTableLocation",
      implicitValueYAML: "Auto",
    },
    table: {
      yaml: "Таблица",
      xml: "Table",
      type: "GanttChartFieldTable",
      toEnterprise: false,
    },
    valuesSelectionMode: {
      yaml: "РежимВыделенияЗначений",
      type: "SystemEnumeration",
      typeSE: "GanttChartValuesSelectionMode",
      implicitValueYAML: "Auto",
    },
    verticalLines: { yaml: "ВертикальныеЛинии", xml: "ShowVerticalLinesFlag", type: "boolean", noImplicitValueYAML: true },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean", implicitValueYAML: true },
    width: { yaml: "Ширина", type: "number", implicitValueYAML: 50 },
    events: {
      type: "Events",
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
    },
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      toYAML: false,
      fromYAML: false,
      defaultType: "GanttChart",
    },
    ...formFieldCommonProperties,
    titleHeight: { ...formFieldCommonProperties.titleHeight, implicitValueYAML: 0 },
  },
} as const satisfies ElementRule

registerElementRule("GanttChartField", GanttChartFieldRules)
