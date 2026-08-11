import type { CommandInterface } from "../types"

export const duplicateCommandAttributeReferenceOrder = {
  itemType: "CommandInterface",
  NavigationPanel: [
    {
      itemType: "CommandInterfaceItem",
      command: "Catalog.ОтветственныеЛицаОрганизаций.StandardCommand.OpenByValue",
      type: "Auto",
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: false,
    },
    {
      itemType: "CommandInterfaceItem",
      command: "Catalog.ОтветственныеЛицаОрганизаций.StandardCommand.OpenByValue",
      type: "Added",
      attribute: "Объект.Ref",
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: false,
    },
  ],
  CommandBar: [],
} as const satisfies CommandInterface
