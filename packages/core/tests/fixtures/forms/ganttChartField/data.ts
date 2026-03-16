import {
  GanttChartField,
  GanttChartFieldEnterprise,
  GanttChartFieldPartialYAML,
} from "~/metadata/forms/elements/ganttChartField/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldEnterpriseTableRelatedFixture,
  fullFormFieldPartialYAMLCommonFixture,
  fullFormFieldTableRelatedFixture,
  fullFormFieldTableRelatedPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullGanttChartField: RequiredFieldsElement<GanttChartField> = {
  itemType: "GanttChartField",
  name: "ПолеДиаграммыГанта",
  title: {
    items: { ru: "Поле диаграммы Ганта" },
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
  ...fullFormFieldTableRelatedFixture,
}

export const fullGanttChartFieldEnterprise = {
  ElementType: "FormField",
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
  ...fullFormFieldEnterpriseTableRelatedFixture,
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
  ...fullFormFieldTableRelatedPartialYAMLCommonFixture,
} satisfies Omit<Required<GanttChartFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование">

export const minimalGanttChartField: GanttChartField = {
  itemType: "GanttChartField",
  name: "ПолеДиаграммыГанта",
}

export const minimalGanttChartFieldPartialYAML: GanttChartFieldPartialYAML = {}
