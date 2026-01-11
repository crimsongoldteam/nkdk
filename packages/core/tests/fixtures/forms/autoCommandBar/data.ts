import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullAutoCommandBar: AutoCommandBar = {
  name: "КакойТоЭлементКоманднаяПанель",
  elementType: FormElementType.CommandBar,
  autofill: true,
  displayImportance: "High",
  horizontalAlign: "Left",
  childItems: [],
}

export const fullAutoCommandBarEnterprise: AutoCommandBarEnterprise = {
  Автозаполнение: "Истина",
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
}

export const minimalAutoCommandBar: AutoCommandBar = {
  elementType: FormElementType.CommandBar,
  name: "КакойТоЭлементКоманднаяПанель",
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
      name: "КакойТоЭлементКоманднаяПанель",
      elementType: FormElementType.CommandBar,
      childItems: [
        {
          elementType: FormElementType.Button,
          name: "Кнопка 1",
          title: { items: { ru: "Номер 1" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Кнопка 2",
          title: { items: { ru: "Номер 2" } },
        },
      ],
    },
    structured: {
      strings: ["<...| Номер 1 {Кнопка1} |Номер 2 {Кнопка2}>"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "without autofill",
    element: {
      name: "КакойТоЭлементКоманднаяПанель",
      elementType: FormElementType.CommandBar,
      autofill: false,
      childItems: [
        {
          elementType: FormElementType.Button,
          name: "Кнопка 1",
          title: { items: { ru: "Номер1" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Кнопка 2",
          title: { items: { ru: "Номер2" } },
        },
      ],
    },
    structured: {
      strings: ["<Кнопка 1 {Кнопка 1} | Кнопка 2 {Кнопка 2}>"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "without buttons",
    element: {
      name: "КакойТоЭлементКоманднаяПанель",
      elementType: FormElementType.CommandBar,
      autofill: true,
      childItems: [],
    },
    structured: {
      strings: ["<...>"],
      haveSimpleHorizontalGroup: false,
    },
  },
  {
    name: "without autofill and buttons",
    element: {
      name: "КакойТоЭлементКоманднаяПанель",
      elementType: FormElementType.CommandBar,
      autofill: false,
      childItems: [],
    },
    structured: {
      strings: ["<>"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
