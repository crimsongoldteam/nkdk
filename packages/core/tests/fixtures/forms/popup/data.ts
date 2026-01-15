import { Popup, PopupPartialEnterprise, PopupTypedEnterprise } from "~/metadata/forms/elements/popup/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullPopup: Popup = {
  elementType: FormElementType.Popup,
  name: "ВсплывающееОкно",
  enableContentChange: true,
  enabled: true,
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  readOnly: false,
  shortcut: "Ctrl+S",
  title: {
    items: { ru: "Всплывающее окно" },
  },
  titleFont: { kind: "StyleItem", ref: "NormalTextFont" },
  titleTextColor: { type: "WebColor", value: "Black" },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  type: "UsualGroup",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: true,
  width: 300,
  backColor: { type: "WebColor", value: "White" },
  borderColor: { type: "WebColor", value: "Gray" },
  picture: undefined,
  representation: "Text",
  shape: "Usual",
  shapeRepresentation: "Auto",
  childItems: [],
}

export const fullPopupPartialEnterprise: PopupPartialEnterprise = {
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяГруппа",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РазрешитьИзменениеСостава: "Истина",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+S",
  ТолькоПросмотр: "Ложь",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  Отображение: "Текст",
  ОтображениеФигуры: "Авто",
  Фигура: "Обычная",
  ЦветРамки: "Серый",
  ЦветФона: "Белый",
  // Заголовок не включается в partial, так как он в defaultLanguage
}

export const fullPopupTypedEnterprise: PopupTypedEnterprise = {
  ...fullPopupPartialEnterprise,
  Тип: "Подменю",
  Заголовок: "Всплывающее окно",
}

export const minimalPopup: Popup = {
  elementType: FormElementType.Popup,
  name: "ВсплывающееОкно",
  childItems: [],
}

export const minimalPopupPartialEnterprise: PopupPartialEnterprise = {}

export const minimalPopupTypedEnterprise: PopupTypedEnterprise = {
  Тип: "Подменю",
}
