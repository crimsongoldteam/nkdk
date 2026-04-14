import { Popup, PopupEnterprise, PopupPartialYAML, PopupTypedYAML } from "~/metadata/forms/elements/popup/types"
import { RequiredFieldsElement } from "~/tests/types"
import {
  fullFormGroupCommonFixture,
  fullFormGroupEnterpriseCommonFixture,
  fullFormGroupPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/formGroup/__fixtures__/data"

export const fullPopup: RequiredFieldsElement<Omit<Popup, "extendedTooltip">> = {
  itemType: "Popup",
  name: "Подменю",
  ...fullFormGroupCommonFixture,
  title: {
    items: {
      ru: "Заголовок подменю",
    },
  },
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
  picture: {
    loadTransparent: true,
    ref: "Print",
    transparentPixel: undefined,
    type: "StandardPicture",
  },
  representation: "PictureAndText",
  shape: "Oval",
  shapeRepresentation: "WhenActive",
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
  Picture: { Type: "Picture", Value: "PictureLib.Print" },
  ...fullFormGroupEnterpriseCommonFixture,
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
  ...fullFormGroupPartialYAMLCommonFixture,
  ВажностьПриОтображении: "ОченьВысокая",
  ИсточникКоманд: "FormCommandPanelGlobalCommands",
  Картинка: "Печать",
  Отображение: "КартинкаИТекст",
  ОтображениеФигуры: "ПриАктивности",
  Фигура: "Овал",
  ЦветРамки: "Аквамарин",
  ЦветФона: "Васильковый",
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
