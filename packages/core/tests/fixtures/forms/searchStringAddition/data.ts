import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
} from "~/metadata/forms/elements/searchStringAddition/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const parentElement: NamedElement = {
  elementType: FormElementType.Form,
  name: "КакойТоЭлемент",
}

export const fullSearchStringAddition: SearchStringAddition = {
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
}

export const minimalSearchStringAddition: SearchStringAddition = {}
