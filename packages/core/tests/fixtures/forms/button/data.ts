import {
  Button,
  ButtonPartialEnterprise,
  ButtonPreview,
  ButtonTypedEnterprise,
} from "~/metadata/forms/elements/button/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullButton: Required<Button> = {
  elementType: FormElementType.Button,
  autoMaxHeight: false,
  autoMaxWidth: false,
  backColor: {
    type: "WebColor",
    value: "Red",
  },
  borderColor: {
    type: "WebColor",
    value: "Green",
  },
  check: true,
  commandName: "Form.Command.КакаяТоКоманда",
  commandUniqueness: false,
  defaultButton: true,
  defaultItem: true,
  displayImportance: "VeryHigh",
  enabled: false,
  extendedTooltip: {
    title: {
      formatted: false,
      items: {
        ru: "Расширенная подсказка",
      },
    },
  },
  font: {
    kind: "StyleItem",
    ref: "LargeTextFont",
  },
  height: 5,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  locationInCommandBar: "InAdditionalSubmenu",
  maxHeight: 2,
  maxWidth: 1,
  name: "ОбычнаяКнопка",
  onlyInAllActions: true, //deprecated in 8.3.15
  onMainServerUnavalableBehavior: "DontChangeBehavior",
  picture: {
    loadTransparent: true,
    ref: "Print",
    transparentPixel: undefined,
    type: "StandardPicture",
  },
  pictureLocation: "Left",
  representation: "PictureAndText",
  representationInContextMenu: "AdditionalInContextMenu",
  shape: "Oval",
  shapeRepresentation: "Always",
  skipOnInput: true,
  textColor: {
    type: "WebColor",
    value: "Blue",
  },
  title: {
    items: {
      ru: "Заголовок кнопки",
    },
  },
  titleHeight: 3,
  toolTipRepresentation: "Balloon",
  type: "UsualButton",
  userVisible: {
    common: true,
    values: [
      {
        name: "Администратор",
        value: true,
      },
    ],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: false,
  width: 10,
}

export const fullButtonSource: Button = {
  elementType: FormElementType.Button,
  name: "Кнопка",
  title: { items: { ru: "Кнопка формы" } },
}

export const fullButtonPartialEnterprise: Required<
  Omit<ButtonPartialEnterprise, "Заголовок" | "ЗапретитьИспользование">
> = {
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  АктивизироватьПоУмолчанию: "Истина",
  ВажностьПриОтображении: "ОченьВысокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяКнопка",
  Видимость: "Ложь",
  Высота: 5,
  ВысотаЗаголовка: 3,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Ложь",
  ИмяКоманды: "Form.Command.КакаяТоКоманда",
  Картинка: "Печать",
  КнопкаПоУмолчанию: "Истина",
  МаксимальнаяВысота: 2,
  МаксимальнаяШирина: 1,
  Отображение: "КартинкаИТекст",
  ОтображениеВКонтекстномМеню: "ДополнительноВКонтекстномМеню",
  ОтображениеПодсказки: "Всплывающая",
  ОтображениеФигуры: "Всегда",
  ПоведениеПриНедоступностиОсновногоСервера: "НеИзменятьПоведение",
  ПоложениеВКоманднойПанели: "ВДополнительномПодменю",
  ПоложениеКартинки: "Лево",
  Пометка: "Истина",
  ПропускатьПриВводе: "Истина",
  РазрешитьИспользование: {
    Администратор: "Истина",
  },
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  РасширеннаяПодсказка: {
    Заголовок: "Расширенная подсказка",
  },
  ТолькоВоВсехДействиях: "Истина",
  УникальностьКоманды: "Ложь",
  Фигура: "Овал",
  ЦветРамки: "Зеленый",
  ЦветТекста: "Синий",
  ЦветФона: "Красный",
  Ширина: 10,
  Шрифт: "КрупныйШрифтТекста",
}

export const fullButtonTypedEnterprise: ButtonTypedEnterprise = {
  ...fullButtonPartialEnterprise,
  Тип: "Кнопка",
  Заголовок: "Заголовок кнопки",
}

export const minimalButton: Button = {
  elementType: FormElementType.Button,
  name: "Кнопка",
}

export const minimalButtonPartialEnterprise: ButtonPartialEnterprise = {}

export const minimalButtonTypedEnterprise: ButtonTypedEnterprise = {
  ...minimalButtonPartialEnterprise,
  Тип: "Кнопка",
}

export const fullButtonPreview: Required<ButtonPreview> = {
  ElementType: "FormButton",
  Name: "ОбычнаяКнопка",
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  BackColor: { Type: "Color", Value: "WebColors.Red" },
  BorderColor: { Type: "Color", Value: "WebColors.Green" },
  Check: true,
  CommandName: "Form.Command.КакаяТоКоманда",
  CommandUniqueness: false,
  DefaultButton: true,
  DefaultItem: true,
  DisplayImportance: { Type: "SystemEnumeration", Value: "DisplayImportance.VeryHigh" },
  Enabled: false,
  Font: { Type: "Font", Value: "StyleFonts.LargeTextFont" },
  Height: 5,
  HorizontalAlignInGroup: { Type: "SystemEnumeration", Value: "ItemHorizontalLocation.Left" },
  HorizontalStretch: true,
  LocationInCommandBar: { Type: "SystemEnumeration", Value: "ButtonLocationInCommandBar.InAdditionalSubmenu" },
  MaxHeight: 2,
  MaxWidth: 1,
  OnMainServerUnavalableBehavior: {
    Type: "SystemEnumeration",
    Value: "OnMainServerUnavalableBehavior.DontChangeBehavior",
  },
  OnlyInAllActions: true,
  Picture: { Type: "Picture", Value: "PictureLib.Print" },
  PictureLocation: { Type: "SystemEnumeration", Value: "FormButtonPictureLocation.Left" },
  Representation: { Type: "SystemEnumeration", Value: "ButtonRepresentation.PictureAndText" },
  Shape: { Type: "SystemEnumeration", Value: "ButtonShape.Oval" },
  ShapeRepresentation: { Type: "SystemEnumeration", Value: "ButtonShapeRepresentation.Always" },
  SkipOnInput: true,
  TextColor: { Type: "Color", Value: "WebColors.Blue" },
  Title: "Заголовок кнопки",
  TitleHeight: 3,
  ToolTipRepresentation: { Type: "SystemEnumeration", Value: "ToolTipRepresentation.Balloon" },
  Type: { Type: "SystemEnumeration", Value: "FormButtonType.UsualButton" },
  VerticalAlignInGroup: { Type: "SystemEnumeration", Value: "ItemVerticalAlign.Top" },
  VerticalStretch: true,
  Visible: false,
  Width: 10,
}

export interface ButtonStructureFixture {
  name: string
  element: Button
  structured: IFormatElementResult
}

export const buttonStructureFixturesTable: ButtonStructureFixture[] = [
  {
    name: "with title",
    element: {
      name: "Заголовок",
      elementType: FormElementType.Button,
      title: { items: { ru: "Заголовок" } },
    },
    structured: {
      strings: ["<Заголовок {Заголовок}>"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "without title",
    element: {
      name: "Кнопка",
      elementType: FormElementType.Button,
      title: undefined,
    },
    structured: {
      strings: ["<{Кнопка}>"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
