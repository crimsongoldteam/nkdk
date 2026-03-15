import {
  GanttChartField,
  GanttChartFieldEnterprise,
  GanttChartFieldPartialYAML,
} from "~/metadata/forms/elements/ganttChartField/types"

import { RequiredFieldsElement } from "~/tests/types"
import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"

export const fullGanttChartField: RequiredFieldsElement<GanttChartField> = {
  itemType: "GanttChartField",
  name: "ПолеДиаграммыГанта",
  title: {
    items: { ru: "Поле диаграммы Ганта" },
  },
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  height: 200,
  horizontalLines: true,
  horizontalStretch: true,
  intervalsSelectionMode: "Single",
  maxHeight: 500,
  maxWidth: 400,
  tableLocation: "None",
  valuesSelectionMode: "Single",
  verticalLines: true,
  verticalStretch: true,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    selection: "ПроцедураВыбора",
    detailProcessing: "ПроцедураОбработкиРасшифровки",
    beforeExpand: "ПроцедураПередРазворачиванием",
    beforeCollapse: "ПроцедураПередСворачиванием",
    onActivateValue: "ПроцедураПриАктивизацииЗначения",
    onActivateInterval: "ПроцедураПриАктивизацииИнтервала",
    onIntervalEditEnd: "ПроцедураПриОкончанииРедактированияИнтервала",
  },
  ...fullFormFieldCommonFixture,
}

export const fullGanttChartFieldEnterprise = {
  Name: "prefix_ПолеДиаграммыГанта",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.GanttChartField",
  },
  Title: "Поле диаграммы Ганта",
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  Height: 200,
  HorizontalLines: true,
  HorizontalStretch: true,
  IntervalsSelectionMode: {
    Type: "SystemEnumeration",
    Value: "GanttChartIntervalsSelectionMode.Single",
  },
  MaxHeight: 500,
  MaxWidth: 400,
  TableLocation: {
    Type: "SystemEnumeration",
    Value: "GanttChartTableLocation.None",
  },
  ValuesSelectionMode: {
    Type: "SystemEnumeration",
    Value: "GanttChartValuesSelectionMode.Single",
  },
  VerticalLines: true,
  VerticalStretch: true,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<GanttChartFieldEnterprise>

export const fullGanttChartFieldPartialYAML: GanttChartFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  ВертикальныеЛинии: "Истина",
  Высота: 200,
  ГоризонтальныеЛинии: "Истина",
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  ПоложениеТаблицы: "Нет",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  РежимВыделенияЗначений: "Одиночный",
  РежимВыделенияИнтервалов: "Одиночный",
  Ширина: 300,
  РазрешитьИспользование: { Администратор: "Истина" },
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Выбор: "ПроцедураВыбора",
    ОбработкаРасшифровки: "ПроцедураОбработкиРасшифровки",
    ПередРазворачиванием: "ПроцедураПередРазворачиванием",
    ПередСворачиванием: "ПроцедураПередСворачиванием",
    ПриАктивизацииЗначения: "ПроцедураПриАктивизацииЗначения",
    ПриАктивизацииИнтервала: "ПроцедураПриАктивизацииИнтервала",
    ПриОкончанииРедактированияИнтервала: "ПроцедураПриОкончанииРедактированияИнтервала",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
}

export const minimalGanttChartField: GanttChartField = {
  itemType: "GanttChartField",
  name: "ПолеДиаграммыГанта",
}

export const minimalGanttChartFieldPartialYAML: GanttChartFieldPartialYAML = {}
