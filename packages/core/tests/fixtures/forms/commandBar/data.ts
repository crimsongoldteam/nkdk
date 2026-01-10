import { IFormatElementResult } from "~/format/types"
import { CommandBar, CommandBarEnterprise } from "~/metadata/forms/elements/commandBar/types"
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
          name: "Button1",
          title: { items: { ru: "Button1" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Button2",
          title: { items: { ru: "Button2" } },
        },
        {
          elementType: FormElementType.Button,
          name: "Button3",
          title: { items: { ru: "Button3" } },
        },
      ],
    },
    structured: {
      strings: ["<Button1|Button2|Button3>"],
      haveSimpleHorizontalGroup: false,
    },
  },
]
