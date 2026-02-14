import { Pages, PagesPartialEnterprise, PagesTypedEnterprise } from "~/metadata/forms/elements/pages/types"
import { FormElementType } from "~/metadata/metadataFactory/metadataType/types"

export const fullPages: Pages = {
  itemType: FormElementType.Pages,
  name: "Страницы",
  enableContentChange: true,
  enabled: true,
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  readOnly: false,
  shortcut: "Ctrl+S",
  title: {
    items: { ru: "Страницы" },
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
  currentPagesState: "Titles",
  currentRowUse: "DontUse",
  pagesRepresentation: "Auto",
  events: {
    onCurrentPageChange: "ПроцедураПриСменеСтраницы",
  },
  childItems: [],
}

export const fullPagesSource: Pages = {
  itemType: FormElementType.Pages,
  name: "Страницы",
  title: { items: { ru: "Страницы" } },
  childItems: [],
}

export const fullPagesPartialEnterprise: PagesPartialEnterprise = {
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
  ИспользованиеТекущейСтроки: "НеИспользует",
  ОтображениеСтраниц: "Авто",
  ТекущееСостояниеСтраниц: "Заголовки",
  События: {
    ПриСменеСтраницы: "ПроцедураПриСменеСтраницы",
  },
}

export const fullPagesTypedEnterprise: PagesTypedEnterprise = {
  Тип: "Страницы",
  Заголовок: "Страницы",
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
  ИспользованиеТекущейСтроки: "НеИспользует",
  ОтображениеСтраниц: "Авто",
  ТекущееСостояниеСтраниц: "Заголовки",
  События: {
    ПриСменеСтраницы: "ПроцедураПриСменеСтраницы",
  },
}

export const minimalPages: Pages = {
  itemType: FormElementType.Pages,
  name: "Страницы",
  childItems: [],
}

export const minimalPagesPartialEnterprise: PagesPartialEnterprise = {}

export const minimalPagesTypedEnterprise: PagesTypedEnterprise = {
  Тип: "Страницы",
}
