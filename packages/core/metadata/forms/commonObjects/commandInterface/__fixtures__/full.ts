import type { CommandInterface, CommandInterfaceYAML } from "../types"

export const fullCommandInterface: CommandInterface = {
  itemType: "CommandInterface",
  NavigationPanel: [
    {
      command: "Catalog.ПодчиненныйСправочник.StandardCommand.OpenByValue",
      type: "Auto",
      index: 0,
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: true,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.ПримерСправочник.Command.КомандаСправочник2",
      type: "Auto",
      index: 1,
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.ПримерСправочник.Command.КомандаСправоник",
      type: "Auto",
      index: 2,
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: false,
      visible: {
        common: true,
        values: [
          {
            name: "Администратор",
            value: true,
          },
        ],
      },
      itemType: "CommandInterfaceItem",
    },
  ],
  CommandBar: [
    {
      command: "Catalog.ПодчиненныйСправочник.StandardCommand.CreateBasedOn",
      type: "Auto",
      index: 0,
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
  ],
}

export const fullCommandInterfaceYAML: CommandInterfaceYAML = {
  ПанельНавигации: [
    {
      Команда: "Catalog.ПодчиненныйСправочник.StandardCommand.OpenByValue",
      Тип: "Auto",
      Индекс: 0,
      ГруппаКоманд: "ПанельНавигацииФормыПерейти",
      Автовидимость: "Истина",
    },
    {
      Команда: "Catalog.ПримерСправочник.Command.КомандаСправочник2",
      Тип: "Auto",
      Индекс: 1,
      ГруппаКоманд: "ПанельНавигацииФормыПерейти",
      Автовидимость: "Ложь",
    },
    {
      Команда: "Catalog.ПримерСправочник.Command.КомандаСправоник",
      Тип: "Auto",
      Индекс: 2,
      ГруппаКоманд: "ПанельНавигацииФормыПерейти",
      Автовидимость: "Ложь",
      РазрешитьИспользование: {
        Администратор: "Истина",
      },
    },
  ],
  КоманднаяПанель: [
    {
      Команда: "Catalog.ПодчиненныйСправочник.StandardCommand.CreateBasedOn",
      Тип: "Auto",
      Индекс: 0,
      Автовидимость: "Ложь",
    },
  ],
}
