import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const parentElement: BaseElement = {
  elementType: FormElementType.Form,
  name: "КакойТоЭлемент",
}

export const fullAutoCommandBar: AutoCommandBar = {
  elementType: FormElementType.AutoCommandBar,
  autofill: false,
  displayImportance: "High",
  horizontalAlign: "Left",
  childItems: [
    {
      elementType: FormElementType.Button,
      name: "Кнопка1",
    },
  ],
}

export const fullAutoCommandBarEnterprise: AutoCommandBarEnterprise = {
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
}

export const fullPropsAutoCommandBar: Partial<AutoCommandBar> = {
  autofill: false,
  displayImportance: "High",
  horizontalAlign: "Left",
}

export const fullPropsAutoCommandBarEnterprise: AutoCommandBarEnterprise = {
  Автозаполнение: "Ложь",
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
}

export const minimalAutoCommandBar: AutoCommandBar = {
  elementType: FormElementType.AutoCommandBar,
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
      elementType: FormElementType.AutoCommandBar,
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
      elementType: FormElementType.AutoCommandBar,
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
      elementType: FormElementType.AutoCommandBar,
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
      elementType: FormElementType.AutoCommandBar,
      autofill: false,
      childItems: [],
    },
    structured: {
      strings: ["<|>"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
