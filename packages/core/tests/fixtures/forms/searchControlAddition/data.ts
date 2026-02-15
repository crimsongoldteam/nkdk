import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
  SingleSearchControlAddition,
  SingleSearchControlAdditionEnterprise,
} from "~/metadata/forms/elements/searchControlAddition/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

export const parentElement: NamedElement = {
  itemType: CollectionFormElementType.CheckBoxField,
  name: "Дополнение",
}

export const sourceSearchControlAddition: SearchControlAddition = {
  itemType: "SearchControlAddition",
  name: "ДополнениеУправлениеПоиском",
  childItems: [],
}

export const fullSingleSearchControlAddition: Required<SingleSearchControlAddition> = {
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
    shortcut: "Ctrl+S",
    skipOnInput: false,
    textColor: { type: "WebColor", value: "Blue" },
    toolTip: {
      items: { ru: "Подсказка" },
    },
    toolTipRepresentation: "None",
    type: "Label",
    userVisible: {
      common: true,
      values: [{ name: "Администратор", value: true }],
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
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  visible: true,
  childItems: [],
}

export const fullSingleSearchControlAdditionEnterprise: SingleSearchControlAdditionEnterprise = {
  АвтоМаксимальнаяШирина: "Истина",
  МаксимальнаяШирина: 400,
  РастягиватьПоГоризонтали: "Истина",
  ЦветРамки: "Черный",
  ЦветТекста: "Черный",
  ЦветФона: "Белый",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Видимость: "Истина",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  Заголовок: "Добавление элемента формы",
  КонтекстноеМеню: {
    ВажностьПриОтображении: "Высокая",
    Автозаполнение: "Истина",
  },
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РасширеннаяПодсказка: {
    Заголовок: "Оформление формы",
    АвтоМаксимальнаяВысота: "Истина",
    АвтоМаксимальнаяШирина: "Истина",
    ВажностьПриОтображении: "Высокая",
    ВертикальноеПоложениеВГруппе: "Верх",
    Вид: "Надпись",
    Видимость: "Истина",
    Высота: 200,
    ГоризонтальноеПоложениеВГруппе: "Лево",
    Доступность: "Истина",
    МаксимальнаяВысота: 500,
    МаксимальнаяШирина: 400,
    ОтображениеПодсказки: "Нет",
    Подсказка: "Подсказка",
    РазрешитьИспользование: { Администратор: "Истина" },
    ПропускатьПриВводе: "Ложь",
    РастягиватьПоВертикали: "Истина",
    РастягиватьПоГоризонтали: "Истина",
    СочетаниеКлавиш: "Ctrl+S",
    ЦветТекста: "Синий",
    Ширина: 300,
    Шрифт: "ОбычныйШрифтТекста",
  },
}

export const fullSearchControlAdditionEnterprise: SearchControlAdditionEnterprise = {
  ...fullSingleSearchControlAdditionEnterprise,
  Источник: "РодительскийЭлемент",
}

export const fullSearchControlAddition: Required<SearchControlAddition> = {
  ...fullSingleSearchControlAddition,
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

export const minimalSearchControlAdditionEnterprise: SearchControlAdditionEnterprise = {}
