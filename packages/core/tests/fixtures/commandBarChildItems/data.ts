import {
  CommandBarChildItem,
  CommandBarChildItemsPartialEnterprise,
  CommandBarChildItemsTypedEnterprise,
} from "~/metadata/forms/collections/childItems/types"
import { ButtonPartialEnterprise } from "~/metadata/forms/elements/button/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

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
    itemType: CollectionFormElementType.Button,
    name: "Кнопка1",
  },
  {
    itemType: CollectionFormElementType.ButtonGroup,
    name: "ГруппаКнопок",
    childItems: [],
  },
  {
    itemType: CollectionFormElementType.Popup,
    name: "Подменю",
    childItems: [],
  },
]

export const fullCommandBarChildItemsTyped: CommandBarChildItem[] = [
  {
    itemType: CollectionFormElementType.Button,
    name: "Кнопка1",
    commandName: "ВыполнитьКоманда1",
  },
  {
    itemType: CollectionFormElementType.ButtonGroup,
    name: "ГруппаКнопок",
    toolTip: { items: { ru: "Подсказка для группы кнопок" } },
    childItems: [
      {
        itemType: CollectionFormElementType.Button,
        name: "Кнопка2",
        commandName: "ВыполнитьКоманда2",
      },
    ],
  },
  {
    itemType: CollectionFormElementType.Popup,
    name: "Подменю",
    toolTip: { items: { ru: "Подсказка для подменю" } },
    childItems: [
      {
        itemType: CollectionFormElementType.Button,
        name: "Кнопка3",
        commandName: "ВыполнитьКоманда3",
      },
    ],
  },
]
