import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  fullCommandBarChildItemsAllEnterprise,
  fullCommandBarChildItemsStructure,
  fullCommandBarChildItemsTyped,
} from "../../commandBarChildItems/data"

export const parentElement: NamedElement = {
  name: "КакойТоЭлемент",
  elementType: FormElementType.BaseElement,
}

export const sourceAutoCommandBar: AutoCommandBar = {
  autofill: false,
  childItems: fullCommandBarChildItemsStructure,
}

export const fullAutoCommandBarAllItems = fullCommandBarChildItemsAllEnterprise

export const fullAutoCommandBar: Required<AutoCommandBar> = {
  autofill: false,
  displayImportance: "High",
  horizontalAlign: "Left",
  childItems: fullCommandBarChildItemsTyped,
}

export const fullAutoExportCommandBarEnterprise: AutoCommandBarEnterprise = {
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
}

export const minimalAutoCommandBar: AutoCommandBar = {
  autofill: true,
  childItems: [],
}

export interface AutoCommandBarStructureFixture {
  name: string
  element: AutoCommandBar
  structured: IFormatElementResult
}

export const autoCommandBarStructureFixturesTable: AutoCommandBarStructureFixture[] = [
  {
    name: "autofill and buttons",
    element: {
      autofill: true,
      childItems: [
        {
          elementType: FormElementType.Button,
          name: "Кнопка1",
          title: { items: { ru: "Номер 1" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Кнопка2",
          title: { items: { ru: "Номер 2" } },
        },
      ],
    },
    structured: {
      strings: ["<... | Номер 1 {Кнопка1} | Номер 2 {Кнопка2}>"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "without autofill",
    element: {
      autofill: false,
      childItems: [
        {
          elementType: FormElementType.Button,
          name: "Кнопка1",
          title: { items: { ru: "Номер 1" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Кнопка2",
          title: { items: { ru: "Номер 2" } },
        },
      ],
    },
    structured: {
      strings: ["<Номер 1 {Кнопка1} | Номер 2 {Кнопка2}>"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "without buttons",
    element: {
      autofill: true,
      childItems: [],
    },
    structured: {
      strings: ["<...|>"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "without autofill and buttons",
    element: {
      autofill: false,
      childItems: [],
    },
    structured: {
      strings: ["<|>"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "with buttons",
    element: {
      autofill: false,
      childItems: [
        {
          elementType: FormElementType.Button,
          name: "Кнопка1",
          title: { items: { ru: "Кнопка Номер 1" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Кнопка2",
          title: { items: { ru: "Кнопка Номер 2" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Кнопка3",
          title: { items: { ru: "Кнопка Номер 3" } },
        },
      ],
    },
    structured: {
      strings: ["<Кнопка Номер 1 {Кнопка1} | Кнопка Номер 2 {Кнопка2} | Кнопка Номер 3 {Кнопка3}>"],
      haveSimpleHorizontalGroup: false,
    },
  },

  {
    name: "with button group",
    element: {
      autofill: false,
      childItems: [
        {
          elementType: FormElementType.ButtonGroup,
          name: "ГруппаКнопок1",
          childItems: [],
          title: { items: { ru: "Группа кнопок" } },
        },
      ],
    },
    structured: {
      strings: ["<#Группа кнопок {ГруппаКнопок1} |>"],
      haveSimpleHorizontalGroup: false,
    },
  },

  {
    name: "with popup",
    element: {
      autofill: false,
      childItems: [
        {
          elementType: FormElementType.Popup,
          name: "Меню",
          title: { items: { ru: "Выпадающее меню" } },
          childItems: [],
        },
      ],
    },
    structured: {
      strings: ["<^Выпадающее меню {Меню} |>"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "with search control addition",
    element: {
      autofill: false,
      childItems: [
        {
          elementType: FormElementType.SearchControlAddition,
          name: "Дополнение",
          childItems: [],
        },
      ],
    },
    structured: {
      strings: ["<?УправлениеПоиском {Дополнение} |>"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "with search string addition",
    element: {
      autofill: false,
      childItems: [
        {
          elementType: FormElementType.SearchStringAddition,
          name: "Дополнение",
        },
      ],
    },
    structured: {
      strings: ["<?ОтображениеСтрокиПоиска {Дополнение} |>"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
