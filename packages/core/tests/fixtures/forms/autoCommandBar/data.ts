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
      name: "КакойТоЭлементКоманднаяПанель",
      elementType: FormElementType.CommandBar,
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
      name: "КакойТоЭлементКоманднаяПанель",
      elementType: FormElementType.CommandBar,
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
