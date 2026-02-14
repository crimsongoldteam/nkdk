import {
  CommandBarChildItem,
  CommandBarChildItemsPartialEnterprise,
  CommandBarChildItemsTypedEnterprise,
} from "~/metadata/forms/collections/childItems/types"
import { ButtonPartialEnterprise } from "~/metadata/forms/elements/button/types"
import { FormElementType } from "~/metadata/metadataFactory/metadataType/types"

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
    itemType: FormElementType.Button,
    name: "Кнопка1",
  },
  {
    itemType: FormElementType.ButtonGroup,
    name: "ГруппаКнопок",
    childItems: [],
  },
  {
    itemType: FormElementType.Popup,
    name: "Подменю",
    childItems: [],
  },
]

export const fullCommandBarChildItemsTyped: CommandBarChildItem[] = [
  {
    itemType: FormElementType.Button,
    name: "Кнопка1",
    commandName: "ВыполнитьКоманда1",
  },
  {
    itemType: FormElementType.ButtonGroup,
    name: "ГруппаКнопок",
    toolTip: { items: { ru: "Подсказка для группы кнопок" } },
    childItems: [
      {
        itemType: FormElementType.Button,
        name: "Кнопка2",
        commandName: "ВыполнитьКоманда2",
      },
    ],
  },
  {
    itemType: FormElementType.Popup,
    name: "Подменю",
    toolTip: { items: { ru: "Подсказка для подменю" } },
    childItems: [
      {
        itemType: FormElementType.Button,
        name: "Кнопка3",
        commandName: "ВыполнитьКоманда3",
      },
    ],
  },
]
