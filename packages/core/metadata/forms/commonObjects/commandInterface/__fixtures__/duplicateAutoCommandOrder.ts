import type { CommandInterface } from "../types"

export const duplicateAutoCommandOrder = {
  itemType: "CommandInterface",
  NavigationPanel: [
    {
      command: "0",
      type: "Auto",
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: false,
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "0",
      type: "Auto",
      commandGroup: "FormNavigationPanelGoTo",
      index: 1,
      defaultVisible: false,
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
  ],
  CommandBar: [],
} as const satisfies CommandInterface
