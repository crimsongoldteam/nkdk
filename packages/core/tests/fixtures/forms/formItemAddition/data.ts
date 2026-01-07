import { FormItemAddition, FormItemAdditionEnterprise } from "~/metadata/forms/elements/formItemAddition/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullFormItemAddition: FormItemAddition = {
  elementType: FormElementType.FormItemAddition,
  name: "ДобавлениеЭлементаФормы",
  id: "1",
  childItems: [],
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
  type: "SearchControl",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  visible: true,
}

export const fullFormItemAdditionEnterprise: FormItemAdditionEnterprise = {
  Заголовок: "Добавление элемента формы",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "УправлениеПоиском",
  Видимость: "Истина",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
}

export const minimalFormItemAddition: FormItemAddition = {
  elementType: FormElementType.FormItemAddition,
  name: "ДобавлениеЭлементаФормы",
  id: "1",
  childItems: [],
}

export const minimalFormItemAdditionEnterprise: FormItemAdditionEnterprise = {}
