import { Page, PagePartialEnterprise } from "~/metadata/forms/elements/page/types"

export const fullPage: Required<Page> = {
  itemType: CollectionFormElementType.Page,
  name: "Страница",
  enableContentChange: true,
  enabled: true,
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  readOnly: false,
  shortcut: "Ctrl+S",
  title: {
    items: { ru: "Страница" },
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
  backColor: { type: "WebColor", value: "White" },
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
  picture: { ref: "Picture", type: "StandardPicture", loadTransparent: true },
  childItemsHorizontalAlign: "Left",
  childItemsVerticalAlign: "Top",
  displayImportance: "High",
  format: {
    items: { ru: "Формат" },
  },
  group: "Vertical",
  horizontalSpacing: "Single",
  itemsAndTitlesAlign: "Auto",
  scrollOnCompress: true,
  showTitle: true,
  slaveItemsWidth: "Auto",
  titleDataPath: "Объект.Заголовок",
  verticalAlign: "Top",
  verticalScrollOnReduceSize: true,
  verticalSpacing: "Single",
  childItems: [],
}

export const fullPagePartialEnterprise: PagePartialEnterprise = {
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
  ВажностьПриОтображении: "Высокая",
  ВертикальнаяПрокруткаПриСжатии: "Истина",
  ВертикальноеПоложение: "Верх",
  ВертикальноеПоложениеПодчиненных: "Верх",
  ВертикальныйИнтервал: "Одинарный",
  ВыравниваниеЭлементовИЗаголовков: "Авто",
  ГоризонтальноеПоложениеПодчиненных: "Лево",
  ГоризонтальныйИнтервал: "Одинарный",
  Группировка: "Вертикальная",
  Картинка: "Картинка",
  ОтображатьЗаголовок: "Истина",
  ПутьКДаннымЗаголовка: "Объект.Заголовок",
  РасширеннаяПодсказка: {
    Заголовок: "Расширенная подсказка",
  },
  СкроллПриСжатии: "Истина",
  Формат: "Формат",
  ЦветФона: "Белый",
  ШиринаПодчиненныхЭлементов: "Авто",
}

export const minimalPage: Page = {
  itemType: CollectionFormElementType.Page,
  name: "Страница",
  childItems: [],
}

export const minimalPagePartialEnterprise: PagePartialEnterprise = {}

// export const minimalPageEnterprise: PagePartialEnterprise = minimalPagePartialEnterprise
