import {
  ButtonGroup,
  ButtonGroupEnterprise,
  ButtonGroupPartialYAML,
  ButtonGroupTypedYAML,
} from "~/metadata/forms/elements/buttonGroup/types"

import {
  fullFormGroupCommonFixture,
  fullFormGroupEnterpriseCommonFixture,
  fullFormGroupPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/formGroup/__fixtures__/data"

import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"

export const fullButtonGroup: ButtonGroup = {
  itemType: "ButtonGroup",
  name: "ГруппаКнопок",
  ...fullFormGroupCommonFixture,
  shortcut: "S",
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
  titleFont: { kind: "StyleItem", ref: "NormalTextFont" },
  titleTextColor: { type: "WebColor", value: "Black" },
  toolTipRepresentation: "None",
  verticalStretch: true,
  width: 300,
  height: 200,
  title: {
    items: { ru: "Группа кнопок" },
  },
  childItems: [
    {
      itemType: "Button",
      name: "Кнопка",
    },
  ],
  representation: "Compact",
  commandSource: "FormCommandPanelGlobalCommands",
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
  ...fullFormGroupEnterpriseCommonFixture,
  TitleFont: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  TitleTextColor: { Type: "Color", Value: "WebColors.Black" },
  ToolTipRepresentation: { Type: "SystemEnumeration", Value: "ToolTipRepresentation.None" },
  VerticalStretch: true,
  Width: 300,
  Height: 200,
  Title: "Группа кнопок",
  CommandSource: "FormCommandPanelGlobalCommands",
} satisfies Required<ButtonGroupEnterprise>

export const fullButtonGroupSource: ButtonGroup = {
  itemType: "ButtonGroup",
  name: "ГруппаКнопок",
  title: { items: { ru: "Группа кнопок" } },
  childItems: [],
}

export const fullButtonGroupPartialYAML: ButtonGroupPartialYAML = {
  ...fullFormGroupPartialYAMLCommonFixture,
  СочетаниеКлавиш: "S",
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  ЦветТекстаЗаголовка: "Черный",
  ОтображениеПодсказки: "Нет",
  РастягиватьПоВертикали: "Истина" as any,
  Ширина: 300,
  Высота: 200,
  ИсточникКоманд: "FormCommandPanelGlobalCommands",
  Отображение: "Компактное",
  Элементы: {
    Кнопка: {
      Тип: "Кнопка",
    },
  },
}

export const fullButtonGroupTypedYAML: ButtonGroupTypedYAML = {
  Тип: "ГруппаКнопок",
  Заголовок: "Группа кнопок",
  ...fullButtonGroupPartialYAML,
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
