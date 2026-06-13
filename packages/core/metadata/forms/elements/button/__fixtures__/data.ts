import {
  Button,
  ButtonEnterprise,
  ButtonPartialYAML,
  ButtonTypedYAML,
  CommandBarButton,
  CommandBarButtonEnterprise,
  CommandBarButtonPartialYAML,
  CommandBarButtonTypedYAML,
} from "~/metadata/forms/elements/button/types"
import { StructureResult } from "~/tests/types"

export interface CommandBarButtonStructureFixture {
  name: string
  element: CommandBarButton
  structured: StructureResult
}

const commonButtonModel = {
  visible: false,
  userVisible: { common: true, values: [{ name: "Role.Администратор", value: false }] },
  titleHeight: 30,
  representation: "PictureAndText" as const,
  defaultButton: true,
  skipOnInput: true,
  enabled: false,
  defaultItem: true,
  width: 10,
  autoMaxWidth: false,
  maxWidth: 20,
  height: 15,
  autoMaxHeight: false,
  maxHeight: 25,
  horizontalStretch: true,
  verticalStretch: true,
  horizontalAlignInGroup: "Left" as const,
  verticalAlignInGroup: "Top" as const,
  check: true,
  commandName: "Form.StandardCommand.Help",
  textColor: { type: "WebColor" as const, value: "Red" },
  backColor: { type: "WebColor" as const, value: "Crimson" },
  borderColor: { type: "WebColor" as const, value: "FireBrick" },
  font: { kind: "StyleItem" as const, ref: "LargeTextFont" as const },
  picture: { ref: "Print", loadTransparent: true, type: "StandardPicture" as const, transparentPixel: undefined },
  title: { items: { ru: "Заголовок элемента" } },
  toolTipRepresentation: "Balloon" as const,
  representationInContextMenu: "None" as const,
  shape: "Usual" as const,
  shapeRepresentation: "WhenActive" as const,
  pictureLocation: "Left" as const,
  locationInCommandBar: "InAdditionalSubmenu" as const,
  commandUniqueness: false,
  onMainServerUnavalableBehavior: "MakeDisable" as const,
  displayImportance: "VeryHigh" as const,
}

const commonButtonPartialYAML = {
  Видимость: "Ложь" as const,
  Использование: { Роли: { "Role.Администратор": "Ложь" as const } },
  ВысотаЗаголовка: 30,
  Отображение: "КартинкаИТекст" as const,
  КнопкаПоУмолчанию: "Истина" as const,
  ПропускатьПриВводе: "Истина" as const,
  Доступность: "Ложь" as const,
  АктивизироватьПоУмолчанию: "Истина" as const,
  Ширина: 10,
  АвтоМаксимальнаяШирина: "Ложь" as const,
  МаксимальнаяШирина: 20,
  Высота: 15,
  АвтоМаксимальнаяВысота: "Ложь" as const,
  МаксимальнаяВысота: 25,
  РастягиватьПоГоризонтали: "Истина" as const,
  РастягиватьПоВертикали: "Истина" as const,
  ГоризонтальноеПоложениеВГруппе: "Лево" as const,
  ВертикальноеПоложениеВГруппе: "Верх" as const,
  Пометка: "Истина" as const,
  ИмяКоманды: "Form.StandardCommand.Help",
  ЦветТекста: "Красный" as const,
  ЦветФона: "Малиновый" as const,
  ЦветРамки: "Кирпичный" as const,
  Шрифт: { Вид: "КрупныйШрифтТекста" } as const,
  Картинка: "Печать" as const,
  Заголовок: "Заголовок элемента" as const,
  ОтображениеПодсказки: "Всплывающая" as const,
  ОтображениеВКонтекстномМеню: "Нет" as const,
  Фигура: "Обычная" as const,
  ОтображениеФигуры: "ПриАктивности" as const,
  ПоложениеКартинки: "Лево" as const,
  ПоложениеВКоманднойПанели: "ВДополнительномПодменю" as const,
  УникальностьКоманды: "Ложь" as const,
  ПоведениеПриНедоступностиОсновногоСервера: "ОтключитьДоступность" as const,
  ВажностьПриОтображении: "ОченьВысокая" as const,
}

const commonButtonEnterpriseFields = {
  ElementType: "FormButton" as const,
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  BackColor: { Type: "Color" as const, Value: "WebColors.Crimson" },
  BorderColor: { Type: "Color" as const, Value: "WebColors.FireBrick" },
  Check: true,
  CommandName: "КомандаЗаглушка",
  CommandUniqueness: false,
  DefaultButton: true,
  DefaultItem: true,
  DisplayImportance: { Type: "SystemEnumeration" as const, Value: "DisplayImportance.VeryHigh" },
  Enabled: false,
  Font: { Type: "Font" as const, Value: "StyleFonts.LargeTextFont" },
  Height: 15,
  HorizontalAlignInGroup: { Type: "SystemEnumeration" as const, Value: "ItemHorizontalLocation.Left" },
  HorizontalStretch: true,
  LocationInCommandBar: {
    Type: "SystemEnumeration" as const,
    Value: "ButtonLocationInCommandBar.InAdditionalSubmenu",
  },
  MaxHeight: 25,
  MaxWidth: 20,
  OnMainServerUnavalableBehavior: {
    Type: "SystemEnumeration" as const,
    Value: "OnMainServerUnavalableBehavior.MakeDisable",
  },
  Picture: { Type: "Picture" as const, Value: "PictureLib.Print" },
  PictureLocation: { Type: "SystemEnumeration" as const, Value: "FormButtonPictureLocation.Left" },
  Representation: { Type: "SystemEnumeration" as const, Value: "ButtonRepresentation.PictureAndText" },
  Shape: { Type: "SystemEnumeration" as const, Value: "ButtonShape.Usual" },
  ShapeRepresentation: { Type: "SystemEnumeration" as const, Value: "ButtonShapeRepresentation.WhenActive" },
  SkipOnInput: true,
  TextColor: { Type: "Color" as const, Value: "WebColors.Red" },
  Title: "Заголовок элемента",
  TitleHeight: 30,
  ToolTipRepresentation: { Type: "SystemEnumeration" as const, Value: "ToolTipRepresentation.Balloon" },
  VerticalAlignInGroup: { Type: "SystemEnumeration" as const, Value: "ItemVerticalAlign.Top" },
  VerticalStretch: true,
  Visible: false,
  Width: 10,
}

//#region Button / UsualButton

export const fullUsualButton = {
  itemType: "Button",
  name: "Button",
  type: "UsualButton",
  ...commonButtonModel,
} satisfies Button

export const fullUsualButtonPartialYAML = {
  ...commonButtonPartialYAML,
} satisfies ButtonPartialYAML

export const fullUsualButtonTypedYAML: ButtonTypedYAML = {
  ...fullUsualButtonPartialYAML,
  Тип: "Кнопка",
  Заголовок: "Заголовок элемента",
}

export const fullUsualButtonEnterprise = {
  ...commonButtonEnterpriseFields,
  Name: "prefix_Button",
  Type: { Type: "SystemEnumeration" as const, Value: "FormButtonType.UsualButton" },
} satisfies ButtonEnterprise

//#endregion

//#region Button / Hyperlink

export const fullHyperlink = {
  itemType: "Button",
  name: "Hyperlink",
  type: "Hyperlink",
  ...commonButtonModel,
} satisfies Button

export const fullHyperlinkPartialYAML = {
  ...commonButtonPartialYAML,
  Вид: "Гиперссылка",
} satisfies ButtonPartialYAML

export const fullHyperlinkTypedYAML: ButtonTypedYAML = {
  ...fullHyperlinkPartialYAML,
  Тип: "Кнопка",
  Заголовок: "Заголовок элемента",
}

export const fullHyperlinkEnterprise = {
  ...commonButtonEnterpriseFields,
  Name: "prefix_Hyperlink",
  Type: { Type: "SystemEnumeration" as const, Value: "FormButtonType.UsualButton" },
} satisfies ButtonEnterprise

//#endregion

//#region CommandBarButton / CommandBarButton

export const fullCommandBarButton = {
  itemType: "CommandBarButton",
  name: "CommanBarButton",
  type: "CommandBarButton",
  ...commonButtonModel,
} satisfies CommandBarButton

export const fullCommandBarButtonPartialYAML = {
  ...commonButtonPartialYAML,
  Вид: "КнопкаКоманднойПанели",
} satisfies CommandBarButtonPartialYAML

export const fullCommandBarButtonTypedYAML: CommandBarButtonTypedYAML = {
  ...fullCommandBarButtonPartialYAML,
  Тип: "КнопкаКоманднойПанели",
  Заголовок: "Заголовок элемента",
}

export const fullCommandBarButtonEnterprise = {
  ...commonButtonEnterpriseFields,
  Name: "prefix_CommanBarButton",
  Type: { Type: "SystemEnumeration" as const, Value: "FormButtonType.CommandBarButton" },
} satisfies CommandBarButtonEnterprise

export const commandBarButtonWithDataPath = {
  itemType: "CommandBarButton",
  name: "ОбщаяКомандаКомандаСПараметром",
  type: "CommandBarButton",
  commandName: "CommonCommand.КомандаСПараметром",
  dataPath: "Items.ДинамическийСписок.CurrentData.Ref",
} satisfies CommandBarButton

export const commandBarButtonWithDataPathPartialYAML = {
  Вид: "КнопкаКоманднойПанели",
  ИмяКоманды: "CommonCommand.КомандаСПараметром",
  Данные: "Items.ДинамическийСписок.CurrentData.Ref",
} satisfies CommandBarButtonPartialYAML

export const commandBarButtonWithDataPathTypedYAML: CommandBarButtonTypedYAML = {
  ...commandBarButtonWithDataPathPartialYAML,
  Тип: "КнопкаКоманднойПанели",
}

export const commandBarButtonWithParameter = {
  itemType: "CommandBarButton",
  name: "ФормаПоказатьВСписке",
  type: "CommandBarButton",
  visible: false,
  commandName: "Form.StandardCommand.ShowInList",
  parameter: "Document.Встреча",
} satisfies CommandBarButton

export const commandBarButtonWithParameterPartialYAML = {
  Вид: "КнопкаКоманднойПанели",
  Видимость: "Ложь",
  ИмяКоманды: "Form.StandardCommand.ShowInList",
  Параметр: "Документ.Встреча",
} satisfies CommandBarButtonPartialYAML

export const commandBarButtonWithParameterTypedYAML: CommandBarButtonTypedYAML = {
  ...commandBarButtonWithParameterPartialYAML,
  Тип: "КнопкаКоманднойПанели",
}

export const commandButtonWithTypeDescriptionParameter = {
  itemType: "Button",
  name: "СоздатьПриемНаРаботу",
  commandName: "Form.Item.Список.StandardCommand.CreateByParameter",
  parameter: {
    typeDescription: { type: ["DocumentRef.ПриемНаРаботу"] },
  },
} satisfies Button

//#endregion

//#region CommandBarButton / CommandBarHyperlink

export const fullCommandBarHyperlink = {
  itemType: "CommandBarButton",
  name: "CommandBarHyperlink",
  type: "CommandBarHyperlink",
  ...commonButtonModel,
} satisfies CommandBarButton

export const fullCommandBarHyperlinkPartialYAML = {
  ...commonButtonPartialYAML,
  Вид: "ГиперссылкаКоманднойПанели",
} satisfies CommandBarButtonPartialYAML

export const fullCommandBarHyperlinkTypedYAML: CommandBarButtonTypedYAML = {
  ...fullCommandBarHyperlinkPartialYAML,
  Тип: "КнопкаКоманднойПанели",
  Заголовок: "Заголовок элемента",
}

export const fullCommandBarHyperlinkEnterprise = {
  ...commonButtonEnterpriseFields,
  Name: "prefix_CommandBarHyperlink",
  Type: { Type: "SystemEnumeration" as const, Value: "FormButtonType.CommandBarButton" },
} satisfies CommandBarButtonEnterprise

//#endregion

export interface ButtonStructureFixture {
  name: string
  element: Button
  structured: StructureResult
}

export const buttonStructureFixturesTable: ButtonStructureFixture[] = [
  {
    name: "with title",
    element: {
      name: "Заголовок",
      itemType: "Button",
      title: { items: { ru: "Заголовок" } },
    },
    structured: {
      strings: ['<"Заголовок" Заголовок>'],
      toOneLineGroup: true,
    },
  },
  {
    name: "without title",
    element: {
      name: "Кнопка",
      itemType: "Button",
      title: undefined,
    },
    structured: {
      strings: ["<Кнопка>"],
      toOneLineGroup: true,
    },
  },
  {
    name: "hyperlink with title",
    element: {
      name: "Гиперссылка",
      itemType: "Button",
      type: "Hyperlink",
      title: { items: { ru: "Ссылка" } },
    },
    structured: {
      strings: ['<~"Ссылка" Гиперссылка>'],
      toOneLineGroup: true,
    },
  },
  {
    name: "hyperlink without title",
    element: {
      name: "Гиперссылка",
      itemType: "Button",
      type: "Hyperlink",
    },
    structured: {
      strings: ["<~Гиперссылка>"],
      toOneLineGroup: true,
    },
  },
]

export const commandBarButtonStructureFixturesTable: CommandBarButtonStructureFixture[] = [
  {
    name: "command bar button with title",
    element: {
      name: "Команда",
      itemType: "CommandBarButton",
      title: { items: { ru: "Кнопка" } },
    },
    structured: {
      strings: ['"Кнопка" Команда'],
      toOneLineGroup: true,
    },
  },
  {
    name: "command bar button without title",
    element: {
      name: "Команда",
      itemType: "CommandBarButton",
    },
    structured: {
      strings: ["Команда"],
      toOneLineGroup: true,
    },
  },
  {
    name: "command bar hyperlink with title",
    element: {
      name: "СсылкаКоманды",
      itemType: "CommandBarButton",
      type: "CommandBarHyperlink",
      title: { items: { ru: "Ссылка" } },
    },
    structured: {
      strings: ['~"Ссылка" СсылкаКоманды'],
      toOneLineGroup: true,
    },
  },
  {
    name: "command bar hyperlink without title",
    element: {
      name: "СсылкаКоманды",
      itemType: "CommandBarButton",
      type: "CommandBarHyperlink",
    },
    structured: {
      strings: ["~СсылкаКоманды"],
      toOneLineGroup: true,
    },
  },
]
