import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { CommandBar, CommandBarEnterprise, CommandBarPartialYAML } from "~/metadata/forms/elements/commandBar/types"
import {
  fullFormGroupCommonFixture,
  fullFormGroupEnterpriseCommonFixture,
  fullFormGroupPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/formGroup/__fixtures__/data"

import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { RequiredFieldsElement } from "~/tests/types"
import {
  fullCommandBarChildItemsAllYAML,
  fullCommandBarChildItemsStructure,
  fullCommandBarChildItemsTyped,
} from "~/tests/fixtures/commandBarChildItems/data"

export const parentElement: NamedElement = {
  name: "КоманднаяПанель",
  itemType: "Table",
}

export const sourceCommandBar: CommandBar = {
  itemType: "CommandBar",
  name: "КоманднаяПанель",
  childItems: fullCommandBarChildItemsStructure,
  title: {
    items: { ru: "Командная панель" },
  },
}

const { extendedTooltip: _eTCB, ...fullFormGroupCommonFixtureForCommandBar } = fullFormGroupCommonFixture

export const fullCommandBar: RequiredFieldsElement<
  Omit<CommandBar, "extendedTooltip" | "shortcut" | "autofill">
> = {
  itemType: "CommandBar",
  name: "КоманднаяПанель",
  ...fullFormGroupCommonFixtureForCommandBar,
  displayImportance: "VeryHigh",
  horizontalAlign: "Center",
  commandSource: "FormCommandPanelGlobalCommands",
  childItems: fullCommandBarChildItemsTyped,
}

export const fullCommandBarEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_КоманднаяПанель",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.CommandBar" },
  ChildItems: [
    {
      CommandName: "КомандаЗаглушка",
      ElementType: "FormButton",
      Type: { Type: "SystemEnumeration", Value: "FormButtonType.UsualButton" },
      Name: "prefix_Кнопка1",
    },
    {
      ChildItems: [
        {
          CommandName: "КомандаЗаглушка",
          ElementType: "FormButton",
          Type: { Type: "SystemEnumeration", Value: "FormButtonType.UsualButton" },
          Name: "prefix_Кнопка2",
        },
      ],
      ToolTip: "Подсказка для группы кнопок",
      ElementType: "FormGroup",
      Type: { Type: "SystemEnumeration", Value: "FormGroupType.ButtonGroup" },
      Name: "prefix_ГруппаКнопок",
    },
    {
      ChildItems: [
        {
          CommandName: "КомандаЗаглушка",
          ElementType: "FormButton",
          Type: { Type: "SystemEnumeration", Value: "FormButtonType.UsualButton" },
          Name: "prefix_Кнопка3",
        },
      ],
      ToolTip: "Подсказка для подменю",
      ElementType: "FormGroup",
      Type: { Type: "SystemEnumeration", Value: "FormGroupType.Popup" },
      Name: "prefix_Подменю",
    },
  ],
  DisplayImportance: { Type: "SystemEnumeration", Value: "DisplayImportance.VeryHigh" },
  HorizontalAlign: { Type: "SystemEnumeration", Value: "ItemHorizontalLocation.Center" },
  ...fullFormGroupEnterpriseCommonFixture,
  Title: "Заголовок элемента",
  CommandSource: "FormCommandPanelGlobalCommands",
} satisfies Required<Omit<CommandBarEnterprise, "Autofill">>

export const fullCommandBarAllItems = fullCommandBarChildItemsAllYAML

export const minimalCommandBar: CommandBar = {
  itemType: "CommandBar",
  name: "КоманднаяПанель",
  childItems: [],
}

export const fullCommandBarSource: CommandBar = {
  ...fullCommandBar,
  childItems: fullCommandBarChildItemsStructure,
}

export const minimalCommandBarPartialYAML: CommandBarPartialYAML = {}

export const fullCommandBarPartialYAML: CommandBarPartialYAML = {
  ...fullFormGroupPartialYAMLCommonFixture,
  ВажностьПриОтображении: "ОченьВысокая",
  ГоризонтальноеПоложение: "Центр",
  ИсточникКоманд: "FormCommandPanelGlobalCommands",
  Элементы: {
    Кнопка1: {
      Вид: "Кнопка",
      ИмяКоманды: "ВыполнитьКоманда1",
    },
    ГруппаКнопок: {
      Вид: "ГруппаКнопок",
      Подсказка: "Подсказка для группы кнопок",
      Элементы: {
        Кнопка2: {
          Вид: "Кнопка",
          ИмяКоманды: "ВыполнитьКоманда2",
        },
      },
    },
    Подменю: {
      Вид: "Подменю",
      Подсказка: "Подсказка для подменю",
      Элементы: {
        Кнопка3: {
          Вид: "Кнопка",
          ИмяКоманды: "ВыполнитьКоманда3",
        },
      },
    },
  },
}

export interface CommandBarStructureFixture {
  name: string
  element: CommandBar
  structured: ToNKDKResult
}

export const commandBarStructureFixturesTable: CommandBarStructureFixture[] = [
  {
    name: "with buttons",
    element: {
      name: "КоманднаяПанель",
      itemType: "CommandBar",
      childItems: [
        {
          itemType: "CommandBarButton",
          name: "Кнопка1",
          title: { items: { ru: "Кнопка Номер 1" } },
        },
        {
          itemType: "CommandBarButton",
          name: "Кнопка2",
          title: { items: { ru: "Кнопка Номер 2" } },
        },
        {
          itemType: "CommandBarButton",
          name: "Кнопка3",
          title: { items: { ru: "Кнопка Номер 3" } },
        },
      ],
    },
    structured: {
      strings: ['<"Кнопка Номер 1" Кнопка1 | "Кнопка Номер 2" Кнопка2 | "Кнопка Номер 3" Кнопка3> КоманднаяПанель'],
      toOneLineGroup: true,
    },
  },

  {
    name: "with button group",
    element: {
      name: "КоманднаяПанель",
      itemType: "CommandBar",
      childItems: [
        {
          itemType: "ButtonGroup",
          name: "ГруппаКнопок1",
          childItems: [],
          title: { items: { ru: "Группа кнопок" } },
        },
      ],
    },
    structured: {
      strings: ['<-"Группа кнопок" ГруппаКнопок1> КоманднаяПанель'],
      toOneLineGroup: true,
    },
  },

  {
    name: "with popup",
    element: {
      name: "КоманднаяПанель",
      itemType: "CommandBar",
      childItems: [
        {
          itemType: "Popup",
          name: "Меню",
          title: { items: { ru: "Выпадающее меню" } },
          childItems: [],
        },
      ],
    },
    structured: {
      strings: ['<+"Выпадающее меню" Меню> КоманднаяПанель'],
      toOneLineGroup: true,
    },
  },
  {
    name: "with search control addition",
    element: {
      name: "КоманднаяПанель",
      itemType: "CommandBar",
      childItems: [
        {
          itemType: "SearchControlAddition",
          name: "Дополнение",
          childItems: [],
        },
      ],
    },
    structured: {
      strings: ["<?УправлениеПоиском Дополнение> КоманднаяПанель"],
      toOneLineGroup: true,
    },
  },
  {
    name: "with search string addition",
    element: {
      name: "КоманднаяПанель",
      itemType: "CommandBar",
      childItems: [
        {
          itemType: "SearchStringAddition",
          name: "Дополнение",
        },
      ],
    },
    structured: {
      strings: ["<?ОтображениеСтрокиПоиска Дополнение> КоманднаяПанель"],
      toOneLineGroup: true,
    },
  },
]
