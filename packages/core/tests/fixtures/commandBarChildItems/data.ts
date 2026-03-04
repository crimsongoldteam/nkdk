import {
  CommandBarChildItem,
  CommandBarChildItemsPartialYAML,
  CommandBarChildItemsTypedYAML,
} from "~/metadata/forms/commonObjects/childItems/types"
import { ButtonPartialYAML } from "~/metadata/forms/elements/button/types"

export const fullCommandBarChildItemsAllYAML: CommandBarChildItemsPartialYAML = {
  Кнопка1: {
    Подсказка: "Подсказка для кнопки",
    ИмяКоманды: "ВыполнитьКоманда1",
  } as ButtonPartialYAML,
  ГруппаКнопок: {
    Подсказка: "Подсказка для группы кнопок",
    ПодчиненныеЭлементы: {
      Кнопка2: {
        Тип: "Кнопка",
        ИмяКоманды: "ВыполнитьКоманда2",
      },
    } as CommandBarChildItemsTypedYAML,
  },
  Подменю: {
    Подсказка: "Подсказка для подменю",
    ПодчиненныеЭлементы: {
      Кнопка3: {
        Тип: "Кнопка",
        ИмяКоманды: "ВыполнитьКоманда3",
      },
    } as CommandBarChildItemsTypedYAML,
  },
}

export const fullCommandBarChildItemsStructure: CommandBarChildItem[] = [
  {
    itemType: "Button",
    name: "Кнопка1",
  },
  {
    itemType: "ButtonGroup",
    name: "ГруппаКнопок",
    childItems: [],
  },
  {
    itemType: "Popup",
    name: "Подменю",
    childItems: [],
  },
]

export const fullCommandBarChildItemsTyped: CommandBarChildItem[] = [
  {
    itemType: "Button",
    name: "Кнопка1",
    commandName: "ВыполнитьКоманда1",
  },
  {
    itemType: "ButtonGroup",
    name: "ГруппаКнопок",
    toolTip: { items: { ru: "Подсказка для группы кнопок" } },
    childItems: [
      {
        itemType: "Button",
        name: "Кнопка2",
        commandName: "ВыполнитьКоманда2",
      },
    ],
  },
  {
    itemType: "Popup",
    name: "Подменю",
    toolTip: { items: { ru: "Подсказка для подменю" } },
    childItems: [
      {
        itemType: "Button",
        name: "Кнопка3",
        commandName: "ВыполнитьКоманда3",
      },
    ],
  },
]
