import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const GanttChartFieldRules = {
  itemType: "GanttChartField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.GanttChartField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    height: { yaml: "Высота", type: "number" },
    horizontalLines: { yaml: "ГоризонтальныеЛинии", type: "boolean" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    intervalsSelectionMode: {
      yaml: "РежимВыделенияИнтервалов",
      type: "SystemEnumeration",
      typeSE: "GanttChartIntervalsSelectionMode",
    },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    tableLocation: {
      yaml: "ПоложениеТаблицы",
      type: "SystemEnumeration",
      typeSE: "GanttChartTableLocation",
    },
    valuesSelectionMode: {
      yaml: "РежимВыделенияЗначений",
      type: "SystemEnumeration",
      typeSE: "GanttChartValuesSelectionMode",
    },
    verticalLines: { yaml: "ВертикальныеЛинии", type: "boolean" },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
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
    ...formFieldTableRelatedProperties,
  },
} as const satisfies ElementRule

registerElementRule("GanttChartField", GanttChartFieldRules)
