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

export const fullCommandBar: RequiredFieldsElement<CommandBar> = {
  itemType: "CommandBar",
  name: "КоманднаяПанель",
  ...fullFormGroupCommonFixture,
  title: {
    items: { ru: "Командная панель" },
  },
  autofill: true,
  displayImportance: "High",
  horizontalAlign: "Left",
  commandSource: "Form",
  childItems: fullCommandBarChildItemsTyped,
}

export const fullCommandBarEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_КоманднаяПанель",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.CommandBar" },
  Autofill: true,
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
  DisplayImportance: { Type: "SystemEnumeration", Value: "DisplayImportance.High" },
  HorizontalAlign: { Type: "SystemEnumeration", Value: "ItemHorizontalLocation.Left" },
  ...fullFormGroupEnterpriseCommonFixture,
  Title: "Командная панель",
  CommandSource: "Form",
} satisfies Required<CommandBarEnterprise>

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
  Заголовок: "Командная панель",
  Автозаполнение: "Истина",
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
  ИсточникКоманд: "Form",
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
          itemType: "Button",
          name: "Кнопка1",
          title: { items: { ru: "Кнопка Номер 1" } },
        },
        {
          itemType: "Button",
          name: "Кнопка2",
          title: { items: { ru: "Кнопка Номер 2" } },
        },
        {
          itemType: "Button",
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
