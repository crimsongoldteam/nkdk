import {
  SearchStringAddition,
  SearchStringAdditionYAML,
  SingleSearchStringAddition,
  SingleSearchStringAdditionYAML,
} from "~/metadata/forms/elements/searchStringAddition/types"

export const parentElement = {
  name: "КакойТоЭлемент",
}

export const sourceSearchStringAddition: SearchStringAddition = {
  itemType: "SearchStringAddition",
  name: "КакойТоЭлементСтрокаПоиска",
}

export const fullSingleSearchStringAddition: SingleSearchStringAddition = {
  itemType: "SingleSearchStringAddition",
  backColor: { type: "WebColor", value: "White" },
  borderColor: { type: "WebColor", value: "Black" },
  displayImportance: "High",
  enabled: true,
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  textColor: { type: "WebColor", value: "Black" },
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
  autoMaxWidth: false,
  maxWidth: 20,
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

export const fullSingleSearchStringAdditionYAML: SingleSearchStringAdditionYAML = {
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Видимость: "Истина",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  Заголовок: "Добавление элемента формы",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  Использование: { Роли: { "Role.Администратор": "Истина" } },
  РастягиватьПоГоризонтали: "Истина",
  АвтоМаксимальнаяШирина: "Ложь",
  МаксимальнаяШирина: 20,
  ЦветРамки: "Черный",
  ЦветТекста: "Черный",
  ЦветФона: "Белый",
  Ширина: 300,
  Шрифт: { Вид: "ОбычныйШрифтТекста" },
  КонтекстноеМеню: { Автозаполнение: "Ложь" },
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
}

export const fullSearchStringAdditionYAML: SearchStringAdditionYAML = {
  ...fullSingleSearchStringAdditionYAML,
  Источник: "КакойТоЭлемент",
}

export const fullSearchStringAddition: SearchStringAddition = {
  ...fullSingleSearchStringAddition,
  itemType: "SearchStringAddition",
  additionSource: "КакойТоЭлемент",
  name: "КакойТоЭлементСтрокаПоиска",
}

export const minimalSearchStringAddition: SearchStringAddition = {
  itemType: "SearchStringAddition",
  name: "КакойТоЭлементСтрокаПоиска",
}

export const minimalSingleSearchStringAddition: SingleSearchStringAddition = {
  itemType: "SingleSearchStringAddition",
}

export const minimaSearchStringAddition: SearchStringAddition = {
  ...minimalSearchStringAddition,
  name: "КакойТоЭлементСтрокаПоиска",
}
