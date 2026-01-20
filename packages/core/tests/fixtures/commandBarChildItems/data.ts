import {
  CommandBarChildItem,
  CommandBarChildItems,
  CommandBarChildItemsPartialEnterprise,
  CommandBarChildItemsTypedEnterprise,
} from "~/metadata/forms/collections/commandBarChildItems/types"
import { ButtonPartialEnterprise } from "~/metadata/forms/elements/button/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullCommandBarChildItemsAllEnterprise: CommandBarChildItemsPartialEnterprise = {
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

export const fullCommandBarChildItemsStructure: CommandBarChildItem[] = [
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
]

export const fullCommandBarChildItemsTyped: CommandBarChildItems = [
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
]
