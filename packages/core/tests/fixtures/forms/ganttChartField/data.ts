import { GanttChartField, GanttChartFieldEnterprise } from "~/metadata/forms/elements/ganttChartField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullGanttChartField: GanttChartField = {
  elementType: FormElementType.GanttChartField,
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
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  valuesSelectionMode: "Single",
  verticalLines: true,
  verticalStretch: true,
  width: 300,
}

export const fullGanttChartFieldEnterprise: GanttChartFieldEnterprise = {
  Заголовок: "Поле диаграммы Ганта",
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  ВертикальныеЛинии: "Истина",
  Высота: 200,
  ГоризонтальныеЛинии: "Истина",
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  ПоложениеТаблицы: "Нет",
  РазрешитьИспользование: { Администратор: "Истина" },
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  РежимВыделенияЗначений: "Одиночный",
  РежимВыделенияИнтервалов: "Одиночный",
  Ширина: 300,
}

export const minimalGanttChartField: GanttChartField = {
  elementType: FormElementType.GanttChartField,
  name: "ПолеДиаграммыГанта",
}

export const minimalGanttChartFieldEnterprise: GanttChartFieldEnterprise = {}
