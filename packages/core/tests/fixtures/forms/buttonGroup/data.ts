import {
  ButtonGroup,
  ButtonGroupEnterprise,
  ButtonGroupPartialYAML,
  ButtonGroupTypedYAML,
} from "~/metadata/forms/elements/buttonGroup/types"

import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"

export const fullButtonGroup: ButtonGroup = {
  itemType: "ButtonGroup",
  height: 200,
  horizontalAlignInGroup: "Left",
  shortcut: "S",
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
  visible: true,
  width: 300,
  name: "ГруппаКнопок",
  childItems: [
    {
      itemType: "Button",
      name: "Кнопка",
    },
  ],
  title: {
    items: { ru: "Группа кнопок" },
  },
  representation: "Compact",
  commandSource: "FormCommandPanelGlobalCommands",
  enableContentChange: false,
  enabled: false,
  horizontalStretch: false,
  readOnly: true,
  verticalStretch: false,
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "ГруппаКнопокРасширеннаяПодсказка" }, formatted: false },
  },
}

export const fullButtonGroupEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_ГруппаКнопок",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.ButtonGroup" },
  ChildItems: [
    {
      ElementType: "FormButton",
      Type: { Type: "SystemEnumeration", Value: "FormButtonType.UsualButton" },
      Name: "prefix_Кнопка",
      CommandName: "КомандаЗаглушка",
    },
  ],
  Representation: {
    Type: "SystemEnumeration",
    Value: "ButtonGroupRepresentation.Compact",
  },
  EnableContentChange: true,
  Enabled: true,
  Height: 200,
  HorizontalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  HorizontalStretch: true,
  ReadOnly: false,
  Title: "Группа кнопок",
  TitleFont: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  TitleTextColor: { Type: "Color", Value: "WebColors.Black" },
  ToolTip: "Подсказка",
  ToolTipRepresentation: {
    Type: "SystemEnumeration",
    Value: "ToolTipRepresentation.None",
  },
  VerticalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Top",
  },
  VerticalStretch: true,
  Visible: true,
  Width: 300,
  CommandSource: "FormCommandPanelGlobalCommands",
} satisfies Required<ButtonGroupEnterprise>

export const fullButtonGroupSource: ButtonGroup = {
  itemType: "ButtonGroup",
  name: "ГруппаКнопок",
  title: { items: { ru: "Группа кнопок" } },
  childItems: [],
}

export const fullButtonGroupPartialYAML: ButtonGroupPartialYAML = {
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяГруппа",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Ложь",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РазрешитьИзменениеСостава: "Ложь",
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  СочетаниеКлавиш: "S",
  ТолькоПросмотр: "Истина",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  ИсточникКоманд: "FormCommandPanelGlobalCommands",
  Отображение: "Компактное",
  РасширеннаяПодсказка: {
    Заголовок: "ГруппаКнопокРасширеннаяПодсказка",
  },
  Элементы: {
    Кнопка: {
      Тип: "Кнопка",
    },
  },
}

export const fullButtonGroupTypedYAML: ButtonGroupTypedYAML = {
  Тип: "ГруппаКнопок",
  Заголовок: "Группа кнопок",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяГруппа",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Ложь",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РазрешитьИзменениеСостава: "Ложь",
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  СочетаниеКлавиш: "S",
  ТолькоПросмотр: "Истина",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  ИсточникКоманд: "FormCommandPanelGlobalCommands",
  Отображение: "Компактное",
  РасширеннаяПодсказка: {
    Заголовок: "ГруппаКнопокРасширеннаяПодсказка",
  },
  Элементы: {
    Кнопка: {
      Тип: "Кнопка",
    },
  },
}

export const minimalButtonGroup: ButtonGroup = {
  itemType: "ButtonGroup",
  name: "ГруппаКнопок",
  childItems: [],
}

export const minimalButtonGroupPartialYAML: ButtonGroupPartialYAML = {}

export const minimalButtonGroupTypedYAML: ButtonGroupTypedYAML = {
  Тип: "ГруппаКнопок",
}

export interface ButtonGroupStructureFixture {
  name: string
  element: ButtonGroup
  structured: ToNKDKResult
}

export const buttonGroupStructureFixturesTable: ButtonGroupStructureFixture[] = [
  {
    name: "with title",
    element: {
      name: "ГруппаКнопок",
      itemType: "ButtonGroup",
      title: { items: { ru: "Группа кнопок" } },
      childItems: [],
    },
    structured: {
      strings: ['-"Группа кнопок" ГруппаКнопок'],
      toOneLineGroup: true,
    },
  },
  {
    name: "without title",
    element: {
      name: "ГруппаКнопок",
      itemType: "ButtonGroup",
      title: undefined,
      childItems: [],
    },
    structured: {
      strings: ["-ГруппаКнопок"],
      toOneLineGroup: true,
    },
  },
]
