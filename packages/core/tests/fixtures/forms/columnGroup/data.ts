import { ColumnGroup, ColumnGroupPropsEnterprise } from "~/metadata/forms/elements/columnGroup/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormGroup } from "../formGroup/data"

export const fullColumnGroup: ColumnGroup = {
  ...fullFormGroup,
  elementType: FormElementType.ColumnGroup,
  name: "ГруппаКолонок",
  title: {
    items: { ru: "Группа колонок" },
  },
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
  childItems: [],
}

export const fullColumnGroupEnterprise: ColumnGroupPropsEnterprise = {
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяГруппа",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РазрешитьИзменениеСостава: "Истина",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+S",
  ТолькоПросмотр: "Ложь",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  Заголовок: "Группа колонок",
  ГоризонтальноеПоложениеВШапке: "Лево",
  Группировка: "Горизонтальная",
  КартинкаШапки: "Печать",
  ОтображатьВШапке: "Истина",
  ОтображатьЗаголовок: "Истина",
  ПутьКДаннымШапки: "Объект.Реквизит",
  ФиксацияВТаблице: "Нет",
  ФорматШапки: "Формат",
  ЦветФонаЗаголовка: "Синий",
}

export const minimalColumnGroup: ColumnGroup = {
  elementType: FormElementType.ColumnGroup,
  name: "ГруппаКолонок",
  childItems: [],
}

export const minimalColumnGroupEnterprise: ColumnGroupPropsEnterprise = {}
