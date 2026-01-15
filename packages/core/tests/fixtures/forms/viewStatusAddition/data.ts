import { ViewStatusAddition, ViewStatusAdditionEnterprise } from "~/metadata/forms/elements/viewStatusAddition/types"

export const parentElement = {
  name: "КакойТоЭлемент",
}

export const fullViewStatusAddition: ViewStatusAddition = {
  autoMaxWidth: true,
  backColor: { type: "WebColor", value: "White" },
  border: { ref: "style:ControlBorder" },
  borderColor: { type: "WebColor", value: "Black" },
  buttonsBackColor: { type: "WebColor", value: "Gray" },
  displayImportance: "High",
  enabled: true,
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  horizontalAlign: "Left",
  horizontalAlignInGroup: "Left",
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
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  visible: true,
  width: 300,
  contextMenu: { autofill: false, childItems: [] },
  extendedTooltip: { title: { items: { ru: "Расширенная подсказка" } } },
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
  ВертикальноеПоложениеВГруппе: "Верх",
  Видимость: "Истина",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  Заголовок: "Добавление элемента формы",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  КонтекстноеМеню: { Автозаполнение: "Ложь" },
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
}

export const minimalViewStatusAddition: ViewStatusAddition = {}
