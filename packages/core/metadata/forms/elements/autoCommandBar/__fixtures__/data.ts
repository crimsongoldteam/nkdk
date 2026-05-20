import { AutoCommandBar, AutoCommandBarYAML } from "~/metadata/forms/elements/autoCommandBar/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { StructureResult } from "~/tests/types"
import {
  fullCommandBarChildItemsAllYAML,
  fullCommandBarChildItemsStructure,
  fullCommandBarChildItemsTyped,
} from "~/tests/fixtures/commandBarChildItems/data"

export const parentElement: NamedElement = {
  name: "КакойТоЭлемент",
  itemType: "Table",
}

export const sourceAutoCommandBar: AutoCommandBar = {
  itemType: "AutoCommandBar",
  autofill: false,
  displayImportance: "High",
  horizontalAlign: "Left",
  childItems: fullCommandBarChildItemsStructure,
}

export const fullAutoCommandBarAllItems = fullCommandBarChildItemsAllYAML

export const fullAutoCommandBar: AutoCommandBar = {
  itemType: "AutoCommandBar",
  autofill: false,
  displayImportance: "High",
  horizontalAlign: "Left",
  childItems: fullCommandBarChildItemsTyped,
}

export const fullAutoExportCommandBarYAML: AutoCommandBarYAML = {
  Автозаполнение: "Ложь",
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
}

export const minimalAutoCommandBar: AutoCommandBar = {
  itemType: "AutoCommandBar",
  autofill: true,
  childItems: [],
}

export interface AutoCommandBarStructureFixture {
  name: string
  element: AutoCommandBar
  structured: StructureResult
}

export const autoCommandBarStructureFixturesTable: AutoCommandBarStructureFixture[] = [
  {
    name: "autofill and buttons",
    element: {
      itemType: "AutoCommandBar",
      autofill: true,
      childItems: [
        {
          itemType: "CommandBarButton",
          name: "Кнопка1",
          title: { items: { ru: "Номер 1" } },
        },
        {
          itemType: "CommandBarButton",
          name: "Кнопка2",
          title: { items: { ru: "Номер 2" } },
        },
      ],
    },
    structured: {
      strings: ['<<... | "Номер 1" Кнопка1 | "Номер 2" Кнопка2>>'],
      toOneLineGroup: false,
    },
  },
  {
    name: "without autofill",
    element: {
      itemType: "AutoCommandBar",
      autofill: false,
      childItems: [
        {
          itemType: "CommandBarButton",
          name: "Кнопка1",
          title: { items: { ru: "Номер 1" } },
        },
        {
          itemType: "CommandBarButton",
          name: "Кнопка2",
          title: { items: { ru: "Номер 2" } },
        },
      ],
    },
    structured: {
      strings: ['<<"Номер 1" Кнопка1 | "Номер 2" Кнопка2>>'],
      toOneLineGroup: false,
    },
  },
  {
    name: "without buttons",
    element: {
      itemType: "AutoCommandBar",
      autofill: true,
      childItems: [],
    },
    structured: {
      strings: ["<<...>>"],
      toOneLineGroup: false,
    },
  },

  {
    name: "without autofill and buttons",
    element: {
      itemType: "AutoCommandBar",
      autofill: false,
      childItems: [],
    },
    structured: {
      strings: ["<<>>"],
      toOneLineGroup: false,
    },
  },
  {
    name: "with buttons",
    element: {
      itemType: "AutoCommandBar",
      autofill: false,
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
      strings: ['<<"Кнопка Номер 1" Кнопка1 | "Кнопка Номер 2" Кнопка2 | "Кнопка Номер 3" Кнопка3>>'],
      toOneLineGroup: false,
    },
  },

  {
    name: "with button group",
    element: {
      itemType: "AutoCommandBar",
      autofill: false,
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
      strings: ['<<-"Группа кнопок" ГруппаКнопок1>>'],
      toOneLineGroup: false,
    },
  },

  {
    name: "with popup",
    element: {
      itemType: "AutoCommandBar",
      autofill: false,
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
      strings: ['<<+"Выпадающее меню" Меню>>'],
      toOneLineGroup: false,
    },
  },
  {
    name: "with search control addition",
    element: {
      itemType: "AutoCommandBar",
      autofill: false,
      childItems: [
        {
          itemType: "SearchControlAddition",
          name: "Дополнение",
          childItems: [],
        },
      ],
    },
    structured: {
      strings: ["<<?УправлениеПоиском Дополнение>>"],
      toOneLineGroup: false,
    },
  },
  {
    name: "with search string addition",
    element: {
      itemType: "AutoCommandBar",
      autofill: false,
      childItems: [
        {
          itemType: "SearchStringAddition",
          name: "Дополнение",
        },
      ],
    },
    structured: {
      strings: ["<<?ОтображениеСтрокиПоиска Дополнение>>"],
      toOneLineGroup: false,
    },
  },
]
