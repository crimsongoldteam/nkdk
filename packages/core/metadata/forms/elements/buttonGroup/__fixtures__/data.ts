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

const { extendedTooltip: _eTBG, ...fullFormGroupCommonFixtureForButtonGroup } = fullFormGroupCommonFixture

export const fullButtonGroup: ButtonGroup = {
  itemType: "ButtonGroup",
  name: "ГруппаКнопок",
  ...fullFormGroupCommonFixtureForButtonGroup,
  displayImportance: "VeryHigh",
  verticalAlignInGroup: "Center",
  childItems: [
    {
      itemType: "CommandBarButton",
      name: "ФормаКоманда1",
      type: "CommandBarButton",
      commandName: "Form.Command.Команда1",
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
      Type: { Type: "SystemEnumeration", Value: "FormButtonType.CommandBarButton" },
      Name: "prefix_ФормаКоманда1",
      CommandName: "КомандаЗаглушка",
    },
  ],
  DisplayImportance: {
    Type: "SystemEnumeration",
    Value: "DisplayImportance.VeryHigh",
  },
  Representation: {
    Type: "SystemEnumeration",
    Value: "ButtonGroupRepresentation.Compact",
  },
  ...fullFormGroupEnterpriseCommonFixture,
  VerticalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Center",
  },
  Title: "Заголовок элемента",
  CommandSource: "FormCommandPanelGlobalCommands",
} satisfies Required<ButtonGroupEnterprise>

export const fullButtonGroupSource: ButtonGroup = {
  itemType: "ButtonGroup",
  name: "ГруппаКнопок",
  title: { items: { ru: "Заголовок элемента" } },
  childItems: [],
}

export const fullButtonGroupPartialYAML: ButtonGroupPartialYAML = {
  ...fullFormGroupPartialYAMLCommonFixture,
  ВажностьПриОтображении: "ОченьВысокая",
  ВертикальноеПоложениеВГруппе: "Центр",
  ИсточникКоманд: "FormCommandPanelGlobalCommands",
  Отображение: "Компактное",
  Элементы: {
    ФормаКоманда1: {
      Вид: "КнопкаКоманднойПанели",
      ТипКнопки: "КнопкаКоманднойПанели",
      ИмяКоманды: "Form.Command.Команда1",
    },
  },
}

export const fullButtonGroupTypedYAML: ButtonGroupTypedYAML = {
  Тип: "ГруппаКнопок",
  Заголовок: "Заголовок элемента",
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
