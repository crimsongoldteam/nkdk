import type { CommandInterface } from "../types"

export const commandBarIndexInsertion = {
  itemType: "CommandInterface",
  NavigationPanel: [],
  CommandBar: [
    {
      command: "CommonCommand.ИнтеграцияС1СДокументооборотСоздатьПисьмо",
      type: "Auto",
      defaultVisible: false,
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "CommonCommand.ИнтеграцияС1СДокументооборотСоздатьБизнесПроцесс",
      type: "Auto",
      defaultVisible: false,
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "BusinessProcess.Задание.StandardCommand.CreateBasedOn",
      type: "Auto",
      defaultVisible: false,
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
  ],
} as const satisfies CommandInterface
