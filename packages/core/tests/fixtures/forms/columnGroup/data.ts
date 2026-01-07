import { ColumnGroup, ColumnGroupEnterprise } from "~/metadata/forms/elements/columnGroup/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullColumnGroup: ColumnGroup = {
  elementType: FormElementType.ColumnGroup,
  name: "ГруппаКолонок",
  id: "1",
  childItems: [],
  fixingInTable: "None",
  group: "Horizontal",
  headerDataPath: "Объект.Реквизит",
  headerFormat: "Формат",
  headerHorizontalAlign: "Left",
  headerPicture: {
    type: "StandardPicture",
    ref: "Print",
    loadTransparent: true,
  },
  showInHeader: true,
  showTitle: true,
  titleBackColor: { type: "WebColor", value: "Blue" },
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
}

export const fullColumnGroupEnterprise: ColumnGroupEnterprise = {
  ГоризонтальноеПоложениеВШапке: "Лево",
  Группировка: "Горизонтальная",
  КартинкаШапки: "Печать",
  ОтображатьВШапке: "Истина",
  ОтображатьЗаголовок: "Истина",
  РазрешитьИспользование: { Администратор: "Истина" },
  ПутьКДаннымШапки: "Объект.Реквизит",
  ФиксацияВТаблице: "Нет",
  ФорматШапки: "Формат",
  ЦветФонаЗаголовка: "Синий",
}

export const minimalColumnGroup: ColumnGroup = {
  elementType: FormElementType.ColumnGroup,
  name: "ГруппаКолонок",
  id: "1",
  childItems: [],
}

export const minimalColumnGroupEnterprise: ColumnGroupEnterprise = {}
