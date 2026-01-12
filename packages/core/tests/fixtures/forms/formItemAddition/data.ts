import {
  FormItemAddition,
  FormItemAdditionPartialEnterprise,
  FormItemAdditionTypedEnterprise,
} from "~/metadata/forms/elements/formItemAddition/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullFormItemAddition: FormItemAddition = {
  elementType: FormElementType.FormItemAddition,
  name: "ДобавлениеЭлементаФормы",
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
  childItems: [],
}

export const fullFormItemAdditionPartialEnterprise: FormItemAdditionPartialEnterprise = {
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

export const fullFormItemAdditionTypedEnterprise: FormItemAdditionTypedEnterprise = {
  ...fullFormItemAdditionPartialEnterprise,
  Тип: "ДополнениеЭлементаФормы",
  Заголовок: "Добавление элемента формы",
}

export const minimalFormItemAddition: FormItemAddition = {
  elementType: FormElementType.FormItemAddition,
  name: "ДобавлениеЭлементаФормы",
  childItems: [],
}

export const minimalFormItemAdditionPartialEnterprise: FormItemAdditionPartialEnterprise = {}

export const minimalFormItemAdditionTypedEnterprise: FormItemAdditionTypedEnterprise = {
  Тип: "ДополнениеЭлементаФормы",
}
