import { Popup, PopupEnterprise, PopupPartialYAML, PopupTypedYAML } from "~/metadata/forms/elements/popup/types"
import { RequiredFieldsElement } from "~/tests/types"

export const fullPopup: RequiredFieldsElement<Omit<Popup, "extendedTooltip">> = {
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
    ref: "Print",
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

export const fullPopupEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_Подменю",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.Popup" },
  BackColor: { Type: "Color", Value: "WebColors.CornFlowerBlue" },
  BorderColor: { Type: "Color", Value: "WebColors.Aquamarine" },
  CommandSource: "FormCommandPanelGlobalCommands",
  ChildItems: [],
  DisplayImportance: {
    Type: "SystemEnumeration",
    Value: "DisplayImportance.VeryHigh",
  },
  EnableContentChange: true,
  Enabled: false,
  Height: 19,
  HorizontalStretch: false,
  ReadOnly: true,
  Representation: {
    Type: "SystemEnumeration",
    Value: "ButtonRepresentation.PictureAndText",
  },
  Shape: { Type: "SystemEnumeration", Value: "ButtonShape.Oval" },
  ShapeRepresentation: {
    Type: "SystemEnumeration",
    Value: "ButtonShapeRepresentation.WhenActive",
  },
  Title: "Заголовок подменю",
  TitleFont: { Type: "Font", Value: "StyleFonts.TextFont" },
  TitleTextColor: { Type: "Color", Value: "WebColors.Fuchsia" },
  ToolTip: "Подсказка подменю",
  ToolTipRepresentation: {
    Type: "SystemEnumeration",
    Value: "ToolTipRepresentation.Button",
  },
  VerticalStretch: false,
  Visible: false,
  Width: 18,
  Picture: { Type: "Picture", Value: "PictureLib.Print" },
} satisfies Required<PopupEnterprise>

export const sourcePopup: Popup = {
  itemType: "Popup",
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
  Картинка: "Печать",
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
  itemType: "Popup",
  name: "Подменю",
  childItems: [],
}

export const minimalPopupPartialYAML: PopupPartialYAML = {}

export const minimalPopupTypedYAML: PopupTypedYAML = {
  Тип: "Подменю",
}
