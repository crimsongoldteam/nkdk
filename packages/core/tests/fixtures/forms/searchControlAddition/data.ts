import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
} from "~/metadata/forms/elements/searchControlAddition/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const parentElement: BaseElement = {
  elementType: FormElementType.Form,
  name: "КакойТоЭлемент",
}

export const fullSearchControlAddition: SearchControlAddition = {
  displayImportance: "High",
  enabled: true,
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

export const fullSearchControlAdditionEnterprise: SearchControlAdditionEnterprise = {
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Видимость: "Истина",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
}

export const minimalSearchControlAddition: SearchControlAddition = {
  childItems: [],
}

export const minimalSearchControlAdditionEnterprise: SearchControlAdditionEnterprise = {}
