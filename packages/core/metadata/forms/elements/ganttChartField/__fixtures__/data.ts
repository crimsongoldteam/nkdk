import { GanttChartField, GanttChartFieldEnterprise, GanttChartFieldPartialYAML } from "../types"
import { Table, TablePartialYAML } from "../../table/types"

import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "../../__fixtures__/formField/rules"
import { RequiredFieldsElement } from "../../../../../tests/types"

const fullGanttChartFieldTable = {
  itemType: "Table",
  name: "ЭлементФормыТаблица",
  representation: "Tree",
  visible: false,
  height: 10,
  heightControlVariant: "UseHeightInFormRows",
  verticalScrollBar: "DontUse",
  dataPath: "Реквизит",
  searchStringLocation: "None",
  viewStatusLocation: "None",
  searchControlLocation: "None",
  childItems: [
    {
      itemType: "TableInputField",
      name: "ЭлементФормыТаблицаТочка",
      dataPath: "Реквизит.Point",
    },
  ],
} satisfies Table

export const fullGanttChartField: RequiredFieldsElement<GanttChartField> = {
  itemType: "GanttChartField",
  name: "ЭлементФормы",
  title: {
    items: { ru: "Поле диаграммы Ганта" },
  },
  autoMaxHeight: false,
  autoMaxWidth: false,
  height: 200,
  horizontalLines: false,
  horizontalStretch: false,
  intervalsSelectionMode: "Single",
  maxHeight: 500,
  maxWidth: 400,
  tableLocation: "None",
  valuesSelectionMode: "Single",
  verticalLines: false,
  verticalStretch: false,
  table: fullGanttChartFieldTable,
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
  ElementType: "FormField",
  Name: "prefix_ЭлементФормы",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.GanttChartField",
  },
  Title: "Поле диаграммы Ганта",
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  Height: 200,
  HorizontalLines: false,
  HorizontalStretch: false,
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
  VerticalLines: false,
  VerticalStretch: false,
  Width: 300,
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<GanttChartFieldEnterprise>

const fullGanttChartFieldTablePartialYAML = {
  Отображение: "Дерево",
  Видимость: "Ложь",
  Высота: 10,
  ВариантУправленияВысотой: "ВСтрокахФормы",
  ВертикальнаяПолосаПрокрутки: "НеИспользовать",
  ПоложениеСтрокиПоиска: "Нет",
  ПоложениеСостоянияПросмотра: "Нет",
  ПоложениеУправленияПоиском: "Нет",
  ПутьКДанным: "Реквизит",
  Элементы: {
    ЭлементФормыТаблицаТочка: {
      Вид: "ПолеВвода",
      ПутьКДанным: "Реквизит.Point",
    },
  },
} satisfies TablePartialYAML

export const fullGanttChartFieldPartialYAML: GanttChartFieldPartialYAML = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  ВертикальныеЛинии: "Ложь",
  Высота: 200,
  ГоризонтальныеЛинии: "Ложь",
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  ПоложениеТаблицы: "Нет",
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  РежимВыделенияЗначений: "Одиночный",
  РежимВыделенияИнтервалов: "Одиночный",
  Заголовок: "Поле диаграммы Ганта",
  Ширина: 300,
  Таблица: fullGanttChartFieldTablePartialYAML,
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
} satisfies Omit<Required<GanttChartFieldPartialYAML>, "Использование">

export const minimalGanttChartField: GanttChartField = {
  itemType: "GanttChartField",
  name: "ПолеДиаграммыГанта",
}

export const minimalGanttChartFieldPartialYAML: GanttChartFieldPartialYAML = {}
