import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SingleSearchStringAddition,
  SingleSearchStringAdditionEnterprise,
} from "~/metadata/forms/elements/searchStringAddition/types"

export const parentElement = {
  name: "КакойТоЭлемент",
}

export const sourceSearchStringAddition: SearchStringAddition = {
  itemType: "SearchStringAddition",
  name: "КакойТоЭлементСтрокаПоиска",
}

export const fullSingleSearchStringAddition: Required<SingleSearchStringAddition> = {
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
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  visible: true,
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

export const fullSingleSearchStringAdditionEnterprise: SingleSearchStringAdditionEnterprise = {
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Видимость: "Истина",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  Заголовок: "Добавление элемента формы",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РастягиватьПоГоризонтали: "Истина",
  ЦветРамки: "Черный",
  ЦветТекста: "Черный",
  ЦветФона: "Белый",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
  КонтекстноеМеню: { Автозаполнение: "Ложь" },
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
}

export const fullSearchStringAdditionEnterprise: SearchStringAdditionEnterprise = {
  ...fullSingleSearchStringAdditionEnterprise,
  Источник: "КакойТоЭлемент",
}

export const fullSearchStringAddition: Required<SearchStringAddition> = {
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
