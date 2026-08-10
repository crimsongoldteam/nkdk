import type { CommandInterface } from "../types"

export const commandGroupReferenceOrder = {
  itemType: "CommandInterface",
  NavigationPanel: [],
  CommandBar: [
    {
      command: "CommonCommand.ДополнительныеСведенияКоманднаяПанель",
      type: "Auto",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.ДоговорыКонтрагентов.Command.ДоговорКонтрагентаВводНаОсновании",
      type: "Auto",
      commandGroup: "FormCommandBarCreateBasedOn",
      index: 1,
      defaultVisible: false,
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
  ],
} as const satisfies CommandInterface
