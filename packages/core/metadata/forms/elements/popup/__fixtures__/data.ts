import { Popup, PopupEnterprise, PopupPartialYAML, PopupTypedYAML } from "~/metadata/forms/elements/popup/types"
import { RequiredFieldsElement } from "~/tests/types"
import {
  fullFormGroupCommonFixture,
  fullFormGroupEnterpriseCommonFixture,
  fullFormGroupPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/formGroup/__fixtures__/data"

const {
  horizontalAlignInGroup: _hAign,
  verticalAlignInGroup: _vAign,
  extendedTooltip: _eT,
  ...fullFormGroupCommonFixtureForPopup
} = fullFormGroupCommonFixture

const {
  HorizontalAlignInGroup: _HA,
  VerticalAlignInGroup: _VA,
  ...fullFormGroupEnterpriseCommonFixtureForPopup
} = fullFormGroupEnterpriseCommonFixture

export const fullPopup: RequiredFieldsElement<
  Omit<Popup, "extendedTooltip" | "shortcut" | "horizontalAlignInGroup" | "verticalAlignInGroup">
> = {
  itemType: "Popup",
  name: "Подменю",
  ...fullFormGroupCommonFixtureForPopup,
  backColor: {
    type: "WebColor",
    value: "MediumOrchid",
  },
  borderColor: {
    type: "WebColor",
    value: "Orange",
  },
  childItems: [],
  displayImportance: "VeryHigh",
  commandSource: "FormCommandPanelGlobalCommands",
  picture: {
    loadTransparent: true,
    ref: "Print",
    type: "StandardPicture",
  },
  representation: "PictureAndText",
  shape: "Usual",
  shapeRepresentation: "WhenActive",
}

export const fullPopupEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_Подменю",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.Popup" },
  BackColor: { Type: "Color", Value: "WebColors.MediumOrchid" },
  BorderColor: { Type: "Color", Value: "WebColors.Orange" },
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
  Shape: { Type: "SystemEnumeration", Value: "ButtonShape.Usual" },
  ShapeRepresentation: {
    Type: "SystemEnumeration",
    Value: "ButtonShapeRepresentation.WhenActive",
  },
  Title: "Заголовок элемента",
  Picture: { Type: "Picture", Value: "PictureLib.Print" },
  ...fullFormGroupEnterpriseCommonFixtureForPopup,
} satisfies Required<Omit<PopupEnterprise, "HorizontalAlignInGroup" | "VerticalAlignInGroup">>

export const sourcePopup: Popup = {
  itemType: "Popup",
  name: "Подменю",
  childItems: [],
  title: {
    items: {
      ru: "Заголовок элемента",
    },
  },
}

const {
  ГоризонтальноеПоложениеВГруппе: _H,
  ВертикальноеПоложениеВГруппе: _V,
  ...fullFormGroupPartialYAMLCommonFixtureForPopup
} = fullFormGroupPartialYAMLCommonFixture

export const fullPopupPartialYAML: PopupPartialYAML = {
  ...fullFormGroupPartialYAMLCommonFixtureForPopup,
  ВажностьПриОтображении: "ОченьВысокая",
  ИсточникКоманд: "FormCommandPanelGlobalCommands",
  Картинка: "Печать",
  Отображение: "КартинкаИТекст",
  ОтображениеФигуры: "ПриАктивности",
  Фигура: "Обычная",
  ЦветРамки: "Оранжевый",
  ЦветФона: "ОрхидеяНейтральный",
}

export const fullPopupTypedYAML: PopupTypedYAML = {
  ...fullPopupPartialYAML,
  Тип: "Подменю",
  Заголовок: "Заголовок элемента",
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
