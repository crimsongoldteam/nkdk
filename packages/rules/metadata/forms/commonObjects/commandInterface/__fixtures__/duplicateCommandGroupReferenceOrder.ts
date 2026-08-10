import type { CommandInterface } from "../types"

export const duplicateCommandGroupReferenceOrder = {
  itemType: "CommandInterface",
  NavigationPanel: [],
  CommandBar: [
    {
      itemType: "CommandInterfaceItem",
      command: "Form.Command.Обновить",
      type: "Auto",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
    },
    {
      itemType: "CommandInterfaceItem",
      command: "Form.Command.Обновить",
      type: "Auto",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
    },
    {
      itemType: "CommandInterfaceItem",
      command: "Form.Command.Обновить",
      type: "Auto",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
    },
  ],
} as const satisfies CommandInterface
