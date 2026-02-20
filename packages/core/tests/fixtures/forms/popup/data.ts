import { Popup, PopupPartialYAML, PopupTypedYAML } from "~/metadata/forms/elements/popup/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

export const fullPopup: Required<Omit<Popup, "extendedTooltip">> = {
  backColor: {
    type: "WebColor",
    value: "CornFlowerBlue",
  },
  borderColor: {
    type: "WebColor",
    value: "Aquamarine",
  },
  childItems: [],
  displayImportance: "VeryHigh",
  commandSource: "FormCommandPanelGlobalCommands",
  itemType: "Popup",
  enableContentChange: true,
  enabled: false,
  height: 19,
  horizontalStretch: false,
  name: "Подменю",
  picture: {
    loadTransparent: true,
    ref: "ChartOfAccounts",
    transparentPixel: undefined,
    type: "StandardPicture",
  },
  readOnly: true,
  representation: "PictureAndText",
  shape: "Oval",
  shapeRepresentation: "WhenActive",
  title: {
    items: {
      ru: "Заголовок подменю",
    },
  },
  titleFont: {
    kind: "StyleItem",
    ref: "TextFont",
  },
  titleTextColor: {
    type: "WebColor",
    value: "Fuchsia",
  },
  toolTip: {
    items: {
      ru: "Подсказка подменю",
    },
  },
  toolTipRepresentation: "Button",
  userVisible: {
    common: true,
    values: [
      {
        name: "Администратор",
        value: true,
      },
    ],
  },
  verticalStretch: false,
  visible: false,
  width: 18,
}

export const sourcePopup: Popup = {
  itemType: CollectionFormElementType.Popup,
  name: "Подменю",
  childItems: [],
  title: {
    items: {
      ru: "Заголовок подменю",
    },
  },
}

export const fullPopupPartialYAML: PopupPartialYAML = {
  ВажностьПриОтображении: "ОченьВысокая",
  Видимость: "Ложь",
  Высота: 19,
  Доступность: "Ложь",
  ИсточникКоманд: "FormCommandPanelGlobalCommands",
  Картинка: "ПланСчетов",
  Отображение: "КартинкаИТекст",
  ОтображениеПодсказки: "Кнопка",
  ОтображениеФигуры: "ПриАктивности",
  Подсказка: "Подсказка подменю",
  РазрешитьИзменениеСостава: "Истина",
  РазрешитьИспользование: {
    Администратор: "Истина",
  },
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  ТолькоПросмотр: "Истина",
  Фигура: "Овал",
  ЦветРамки: "Аквамарин",
  ЦветТекстаЗаголовка: "Фуксия",
  ЦветФона: "Васильковый",
  Ширина: 18,
  ШрифтЗаголовка: "ШрифтТекста",
}

export const fullPopupTypedYAML: PopupTypedYAML = {
  ...fullPopupPartialYAML,
  Тип: "Подменю",
  Заголовок: "Заголовок подменю",
}

export const minimalPopup: Popup = {
  itemType: CollectionFormElementType.Popup,
  name: "Подменю",
  childItems: [],
}

export const minimalPopupPartialYAML: PopupPartialYAML = {}

export const minimalPopupTypedYAML: PopupTypedYAML = {
  Тип: "Подменю",
}
