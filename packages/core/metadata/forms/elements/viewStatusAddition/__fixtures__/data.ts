import { ViewStatusAddition, ViewStatusAdditionYAML } from "~/metadata/forms/elements/viewStatusAddition/types"

export const fullViewStatusAddition: ViewStatusAddition = {
  itemType: "ViewStatusAddition",
  name: "КакойТоЭлементСостояниеПросмотра",
  additionSource: "КакойТоЭлемент",
  autoMaxWidth: true,
  backColor: { type: "WebColor", value: "White" },
  border: { ref: "style:ControlBorder" },
  borderColor: { type: "WebColor", value: "Black" },
  buttonsBackColor: { type: "WebColor", value: "Gray" },
  displayImportance: "High",
  enabled: true,
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  horizontalAlign: "Left",
  horizontalStretch: true,
  maxWidth: 500,
  textColor: { type: "WebColor", value: "Black" },
  titleFont: { kind: "StyleItem", ref: "NormalTextFont" },
  titleTextColor: { type: "WebColor", value: "Blue" },
  title: {
    items: { ru: "Добавление элемента формы" },
  },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  width: 300,
  contextMenu: {
    itemType: "ContextMenu",
    autofill: false,
    childItems: [],
  },
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
}

export const nonCanonicalViewStatusAddition = {
  itemType: "ViewStatusAddition",
  name: "ТаблицаЭПСостояниеПросмотра",
  additionSource: "Подписи",
  contextMenu: { itemType: "ContextMenu", childItems: [] },
  extendedTooltip: { itemType: "ExtendedTooltip" },
} satisfies ViewStatusAddition

export const visibleFalseViewStatusAddition = {
  itemType: "ViewStatusAddition",
  name: "КакойТоЭлементСостояниеПросмотра",
  additionSource: "КакойТоЭлемент",
  contextMenu: { itemType: "ContextMenu", childItems: [] },
  enabled: true,
  extendedTooltip: { itemType: "ExtendedTooltip" },
  visible: false,
} satisfies ViewStatusAddition

export const fullViewStatusAdditionYAML: ViewStatusAdditionYAML = {
  Источник: "КакойТоЭлемент",
  АвтоМаксимальнаяШирина: "Истина",
  ГоризонтальноеПоложение: "Лево",
  МаксимальнаяШирина: 500,
  Рамка: { Имя: "style:ControlBorder" },
  РастягиватьПоГоризонтали: "Истина",
  ЦветРамки: "Черный",
  ЦветТекста: "Черный",
  ЦветТекстаЗаголовка: "Синий",
  ЦветФона: "Белый",
  ЦветФонаКнопок: "Серый",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  ВажностьПриОтображении: "Высокая",
  Доступность: "Истина",
  Заголовок: "Добавление элемента формы",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  КонтекстноеМеню: { Автозаполнение: "Ложь" },
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
}

export const visibleFalseViewStatusAdditionYAML: ViewStatusAdditionYAML = {
  Источник: "КакойТоЭлемент",
  Доступность: "Истина",
  Видимость: "Ложь",
}

export const minimalViewStatusAdditionYAML: ViewStatusAdditionYAML = {}
