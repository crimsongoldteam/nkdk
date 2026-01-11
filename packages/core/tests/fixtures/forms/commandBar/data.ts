import { CommandBar, CommandBarEnterprise } from "~/metadata/forms/elements/commandBar/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormGroup, fullFormGroupEnterprise } from "../formGroup/data"

export const fullCommandBar: CommandBar = {
  ...fullFormGroup,
  elementType: FormElementType.CommandBar,
  name: "КоманднаяПанель",
  title: {
    items: { ru: "Командная панель" },
  },
  autofill: true,
  displayImportance: "High",
  horizontalAlign: "Left",
  childItems: [],
}

export const fullCommandBarEnterprise: CommandBarEnterprise = {
  ...fullFormGroupEnterprise,
  Заголовок: "Командная панель",
  Автозаполнение: "Истина",
  ВажностьПриОтображении: "Высокая",
  ГоризонтальноеПоложение: "Лево",
}

export const minimalCommandBar: CommandBar = {
  elementType: FormElementType.CommandBar,
  name: "КоманднаяПанель",
  childItems: [],
}

export const minimalCommandBarEnterprise: CommandBarEnterprise = {}

export interface CommandBarStructureFixture {
  name: string
  element: CommandBar
  structured: IFormatElementResult
}

export const commandBarStructureFixturesTable: CommandBarStructureFixture[] = [
  {
    name: "with buttons",
    element: {
      name: "CommandBar",
      elementType: FormElementType.CommandBar,
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
]
