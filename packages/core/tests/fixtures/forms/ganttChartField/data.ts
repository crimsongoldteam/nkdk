import {
  GanttChartField,
  GanttChartFieldPartialEnterprise,
  GanttChartFieldTypedEnterprise,
} from "~/metadata/forms/elements/ganttChartField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormField, fullFormFieldEnterprise } from "../formField/data"

export const fullGanttChartField: GanttChartField = {
  ...fullFormField,
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

export const fullGanttChartFieldPartialEnterprise: GanttChartFieldPartialEnterprise = {
  ...fullFormFieldEnterprise,
  Заголовок: "Поле диаграммы Ганта",
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
}

export const fullGanttChartFieldTypedEnterprise: GanttChartFieldTypedEnterprise = {
  ...fullGanttChartFieldPartialEnterprise,
  Тип: "ПолеДиаграммыГанта",
}

export const minimalGanttChartField: GanttChartField = {
  elementType: FormElementType.GanttChartField,
  name: "ПолеДиаграммыГанта",
}

export const minimalGanttChartFieldPartialEnterprise: GanttChartFieldPartialEnterprise = {}

export const minimalGanttChartFieldTypedEnterprise: GanttChartFieldTypedEnterprise = {
  Тип: "ПолеДиаграммыГанта",
}
