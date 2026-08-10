import type { CommandInterface } from "../types"

export const indexedItemOrderSwap = {
  itemType: "CommandInterface",
  NavigationPanel: [
    {
      command: "DataProcessor.ЗагрузкаКурсовВалютЕЦБ.Command.ЗагрузитьКурсыВалютЕЦБ",
      type: "Added",
      index: 1,
      defaultVisible: false,
      commandGroup: "FormNavigationPanelGoTo",
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "InformationRegister.ОтносительныеКурсыВалют.Command.ЗагрузитьКурсыИзТаблицы",
      type: "Added",
      defaultVisible: false,
      commandGroup: "FormNavigationPanelGoTo",
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
  ],
  CommandBar: [],
} as const satisfies CommandInterface
