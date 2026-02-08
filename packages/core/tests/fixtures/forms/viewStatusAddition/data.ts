import { ViewStatusAddition, ViewStatusAdditionEnterprise } from "~/metadata/forms/elements/viewStatusAddition/types"

export const parentElement = {
  name: "КакойТоЭлемент",
}

export const fullViewStatusAddition: Required<ViewStatusAddition> = {
  elementType: "ViewStatusAddition",
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
    elementType: "ContextMenu",
    autofill: false,
    childItems: [],
  },
  extendedTooltip: {
    elementType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
}

export const fullViewStatusAdditionEnterprise: ViewStatusAdditionEnterprise = {
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

export const minimalViewStatusAddition: ViewStatusAddition = {
  elementType: "ViewStatusAddition",
}

export const minimalViewStatusAdditionEnterprise: ViewStatusAdditionEnterprise = {}
