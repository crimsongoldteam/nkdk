import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "~/metadata/forms/elements/extendedTooltip/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const defaultExtendedTooltip: ExtendedTooltip = {}

export const parentElement: NamedElement = {
  elementType: FormElementType.InputField,
  name: "КакойТоЭлемент",
}

export const otherParentElement: NamedElement = {
  elementType: FormElementType.InputField,
  name: "ДругойЭлемент",
}

export const fullExtendedTooltip: ExtendedTooltip = {
  title: {
    items: { ru: "Оформление формы" },
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
}

export const fullExtendedTooltipEnterprise: ExtendedTooltipEnterprise = {
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
}

export const minimalExtendedTooltip: ExtendedTooltip = {}

export const minimalExtendedTooltipEnterprise: ExtendedTooltipEnterprise = {}
