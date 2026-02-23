import { ColumnGroup, ColumnGroupPartialYAML, ColumnGroupTypedYAML } from "~/metadata/forms/elements/columnGroup/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

export const fullColumnGroup: ColumnGroup = {
  itemType: CollectionFormElementType.ColumnGroup,
  name: "ГруппаКолонок",
  enableContentChange: true,
  enabled: true,
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  readOnly: false,
  shortcut: "Ctrl+S",
  title: {
    items: { ru: "Группа колонок" },
  },
  titleFont: { kind: "StyleItem", ref: "NormalTextFont" },
  titleTextColor: { type: "WebColor", value: "Black" },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  type: "UsualGroup",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: true,
  width: 300,
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

export const fullColumnGroupPartialYAML: ColumnGroupPartialYAML = {
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
  ГоризонтальноеПоложениеВШапке: "Лево",
  // Группировка: "Горизонтальная",
  КартинкаШапки: "Печать",
  ОтображатьВШапке: "Истина",
  ОтображатьЗаголовок: "Истина",
  ПутьКДаннымШапки: "Объект.Реквизит",
  ФиксацияВТаблице: "Нет",
  ФорматШапки: "Формат",
  ЦветФонаЗаголовка: "Синий",
}

export const fullColumnGroupTypedYAML: ColumnGroupTypedYAML = {
  Тип: "ГруппаКолонок",
  Заголовок: "Группа колонок",
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
  itemType: CollectionFormElementType.ColumnGroup,
  name: "ГруппаКолонок",
  childItems: [],
  group: "Vertical",
}

export const minimalColumnGroupPartialYAML: ColumnGroupPartialYAML = {}

export const minimalColumnGroupTypedYAML: ColumnGroupTypedYAML = {
  Тип: "ГруппаКолонок",
}
