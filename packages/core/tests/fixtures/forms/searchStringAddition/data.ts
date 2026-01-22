import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SingleSearchStringAddition,
} from "~/metadata/forms/elements/searchStringAddition/types"

export const parentElement = {
  name: "КакойТоЭлемент",
}

export const sourceSearchStringAddition: SearchStringAddition = {
  elementType: "SearchStringAddition",
  name: "КакойТоЭлементСтрокаПоиска",
}

export const fullSingleSearchStringAddition: SingleSearchStringAddition = {
  elementType: "SearchStringAddition",
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
  contextMenu: { autofill: false, childItems: [] },
  extendedTooltip: { title: { items: { ru: "Расширенная подсказка" }, formatted: false } },
}

export const fullSearchStringAdditionEnterprise: SearchStringAdditionEnterprise = {
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

export const fullSearchStringAddition: SearchStringAddition = {
  ...fullSingleSearchStringAddition,
  name: "КакойТоЭлементСтрокаПоиска",
}

export const minimalSearchStringAddition: SearchStringAddition = {
  elementType: "SearchStringAddition",
  name: "КакойТоЭлементСтрокаПоиска",
}

export const minimalSingleSearchStringAddition: SingleSearchStringAddition = {
  elementType: "SearchStringAddition",
}
