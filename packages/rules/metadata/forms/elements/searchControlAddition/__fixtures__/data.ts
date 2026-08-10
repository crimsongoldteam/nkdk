import { NamedElement } from "../../baseElement/types"
import {
  SearchControlAddition,
  SearchControlAdditionYAML,
  SingleSearchControlAddition,
  SingleSearchControlAdditionYAML,
} from "../types"

export const parentElement: NamedElement = {
  itemType: "CheckBoxField",
  name: "Дополнение",
}

export const sourceSearchControlAddition: SearchControlAddition = {
  itemType: "SearchControlAddition",
  name: "ДополнениеУправлениеПоиском",
  childItems: [],
}

export const fullSingleSearchControlAddition: SingleSearchControlAddition = {
  itemType: "SingleSearchControlAddition",
  autoMaxWidth: true,
  backColor: { type: "WebColor", value: "White" },
  borderColor: { type: "WebColor", value: "Black" },
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  horizontalStretch: true,
  maxWidth: 400,
  textColor: { type: "WebColor", value: "Black" },
  width: 300,
  contextMenu: {
    itemType: "ContextMenu",
    displayImportance: "High",
    autofill: true,
    childItems: [],
  },
  displayImportance: "High",
  enabled: true,
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: {
      items: { ru: "Оформление формы" },
      formatted: false,
    },
    autoMaxHeight: true,
    autoMaxWidth: true,
    displayImportance: "High",
    enabled: true,
    font: { kind: "StyleItem", ref: "NormalTextFont" },
    height: 200,
    horizontalAlignInGroup: "Left",
    horizontalStretch: true,
    maxHeight: 500,
    maxWidth: 400,
    shortcut: "S",
    skipOnInput: false,
    textColor: { type: "WebColor", value: "Blue" },
    toolTip: {
      items: { ru: "Подсказка" },
    },
    toolTipRepresentation: "None",
    userVisible: {
      common: true,
      values: [{ name: "Role.Администратор", value: true }],
    },
    verticalAlignInGroup: "Top",
    verticalStretch: true,
    visible: true,
    width: 300,
  },
  horizontalAlignInGroup: "Left",
  title: {
    items: { ru: "Добавление элемента формы" },
  },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  userVisible: {
    common: true,
    values: [{ name: "Role.Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  visible: true,
  childItems: [],
}

export const fullSingleSearchControlAdditionYAML: SingleSearchControlAdditionYAML = {
  МаксимальнаяШирина: 400,
  РастягиватьПоГоризонтали: "Истина",
  ЦветРамки: "Черный",
  ЦветТекста: "Черный",
  ЦветФона: "Белый",
  Ширина: 300,
  Шрифт: { Вид: "ОбычныйШрифтТекста" },
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Видимость: "Истина",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Заголовок: "Добавление элемента формы",
  КонтекстноеМеню: {
    ВажностьПриОтображении: "Высокая",
    Автозаполнение: "Истина",
  },
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  Использование: { Роли: { "Role.Администратор": "Истина" } },
  РасширеннаяПодсказка: {
    Заголовок: {
      Текст: "Оформление формы",
    },
    ВажностьПриОтображении: "Высокая",
    ВертикальноеПоложениеВГруппе: "Верх",
    Видимость: "Истина",
    Высота: 200,
    ГоризонтальноеПоложениеВГруппе: "Лево",
    Доступность: "Истина",
    МаксимальнаяВысота: 500,
    МаксимальнаяШирина: 400,
    ОтображениеПодсказки: "Нет",
    Подсказка: "Подсказка",
    Использование: { Роли: { "Role.Администратор": "Истина" } },
    ПропускатьПриВводе: "Ложь",
    РастягиватьПоВертикали: "Истина",
    РастягиватьПоГоризонтали: "Истина",
    СочетаниеКлавиш: "S",
    ЦветТекста: "Синий",
    Ширина: 300,
    Шрифт: { Вид: "ОбычныйШрифтТекста" },
  },
}

export const fullSearchControlAdditionYAML: SearchControlAdditionYAML = {
  ...fullSingleSearchControlAdditionYAML,
  Источник: "РодительскийЭлемент",
}

export const fullSearchControlAddition: SearchControlAddition = {
  ...fullSingleSearchControlAddition,
  itemType: "SearchControlAddition",
  additionSource: "РодительскийЭлемент",
  name: "ДополнениеУправлениеПоиском",
}

const {
  autoMaxWidth: fullSingleSearchControlAdditionAutoMaxWidth,
  enabled: fullSingleSearchControlAdditionEnabled,
  extendedTooltip: fullSingleSearchControlAdditionExtendedTooltip,
  ...fullSingleSearchControlAdditionFromCompactYAML
} = fullSingleSearchControlAddition
const {
  autoMaxHeight: fullSearchControlAdditionExtendedTooltipAutoMaxHeight,
  autoMaxWidth: fullSearchControlAdditionExtendedTooltipAutoMaxWidth,
  ...fullSearchControlAdditionExtendedTooltipFromCompactYAML
} = fullSingleSearchControlAdditionExtendedTooltip!
void fullSingleSearchControlAdditionAutoMaxWidth
void fullSingleSearchControlAdditionEnabled
void fullSearchControlAdditionExtendedTooltipAutoMaxHeight
void fullSearchControlAdditionExtendedTooltipAutoMaxWidth

export const fullSearchControlAdditionFromCompactYAML: SearchControlAddition = {
  ...fullSingleSearchControlAdditionFromCompactYAML,
  extendedTooltip: fullSearchControlAdditionExtendedTooltipFromCompactYAML,
  itemType: "SearchControlAddition",
  additionSource: "РодительскийЭлемент",
  name: "ДополнениеУправлениеПоиском",
}

export const minimalSearchControlAddition: SearchControlAddition = {
  itemType: "SearchControlAddition",
  name: "ДополнениеУправлениеПоиском",
  childItems: [],
}

export const minimalSingleSearchControlAddition: SingleSearchControlAddition = {
  itemType: "SingleSearchControlAddition",
  childItems: [],
}

export const minimalSearchControlAdditionYAML: SearchControlAdditionYAML = {}
