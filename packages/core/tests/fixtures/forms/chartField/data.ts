import { ChartField, ChartFieldEnterprise } from "~/metadata/forms/elements/chartField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullChartField: ChartField = {
  elementType: FormElementType.ChartField,
  name: "ПолеДиаграммы",
  id: "1",
  title: {
    items: { ru: "Поле диаграммы" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalStretch: true,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    selection: "ПроцедураВыбора",
  },
}

export const fullChartFieldEnterprise: ChartFieldEnterprise = {
  Заголовок: "Поле диаграммы",
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Высота: 200,
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  РазрешитьИспользование: { Администратор: "Истина" },
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  Ширина: 300,
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Выбор: "ПроцедураВыбора",
  },
}

export const minimalChartField: ChartField = {
  elementType: FormElementType.ChartField,
  name: "ПолеДиаграммы",
  id: "1",
}

export const minimalChartFieldEnterprise: ChartFieldEnterprise = {}
