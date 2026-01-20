import { ChildItemsPartialEnterprise } from "~/metadata/forms/collections/childItems/types"
import { CommandBarChildItemsTypedEnterprise } from "~/metadata/forms/collections/commandBarChildItems/types"
import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { ButtonPartialEnterprise } from "~/metadata/forms/elements/button/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const parentElement: NamedElement = {
  name: "КакойТоЭлемент",
  elementType: FormElementType.BaseElement,
}

export const sourceAutoCommandBar: AutoCommandBar = {
  autofill: false,
  childItems: [
    {
      elementType: FormElementType.Button,
      name: "Кнопка1",
    },
    {
      elementType: FormElementType.ButtonGroup,
      name: "ГруппаКнопок",
      childItems: [],
    },
    {
      elementType: FormElementType.Popup,
      name: "Подменю",
      childItems: [],
    },
  ],
}

export const fullChildItems: ChildItemsPartialEnterprise = {
  Кнопка1: {
    Подсказка: "Подсказка для кнопки",
    ИмяКоманды: "ВыполнитьКоманда1",
  } as ButtonPartialEnterprise,
  ГруппаКнопок: {
    Подсказка: "Подсказка для группы кнопок",
    ПодчиненныеЭлементы: {
      Кнопка2: {
        Тип: "Кнопка",
        ИмяКоманды: "ВыполнитьКоманда2",
      },
    } as CommandBarChildItemsTypedEnterprise,
  },
  Подменю: {
    Подсказка: "Подсказка для подменю",
    ПодчиненныеЭлементы: {
      Кнопка3: {
        Тип: "Кнопка",
        ИмяКоманды: "ВыполнитьКоманда3",
      },
    } as CommandBarChildItemsTypedEnterprise,
  },
}

export const fullAutoCommandBar: AutoCommandBar = {
  autofill: false,
  displayImportance: "High",
  horizontalAlign: "Left",
  childItems: [
    {
      elementType: FormElementType.Button,
      name: "Кнопка1",
      commandName: "ВыполнитьКоманда1",
    },
    {
      elementType: FormElementType.ButtonGroup,
      name: "ГруппаКнопок",
      toolTip: { items: { ru: "Подсказка для группы кнопок" } },
      childItems: [
        {
          elementType: FormElementType.Button,
          name: "Кнопка2",
          commandName: "ВыполнитьКоманда2",
        },
      ],
    },
    {
      elementType: FormElementType.Popup,
      name: "Подменю",
      toolTip: { items: { ru: "Подсказка для подменю" } },
      childItems: [
        {
          elementType: FormElementType.Button,
          name: "Кнопка3",
          commandName: "ВыполнитьКоманда3",
        },
      ],
    },
  ],
}

export const fullAutoExportCommandBarEnterprise: AutoCommandBarEnterprise = {
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
}

export const fullPropsAutoCommandBar: AutoCommandBar = {
  autofill: false,
  displayImportance: "High",
  horizontalAlign: "Left",
  childItems: [],
}

export const fullPropsAutoCommandBarEnterprise: AutoCommandBarEnterprise = {
  Автозаполнение: "Ложь",
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
]
