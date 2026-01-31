import { CommandInterface, CommandInterfaceEnterprise } from "~/metadata/forms/commonObjects/commandInterface/types"

export const fullCommandInterface: CommandInterface = {
  NavigationPanel: [
    {
      command: "Catalog.ПодчиненныйСправочник.StandardCommand.OpenByValue",
      type: "Auto",
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: true,
    },
    {
      command: "Catalog.ПримерСправочник.Command.КомандаСправочник2",
      type: "Auto",
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: false,
    },
    {
      command: "Catalog.ПримерСправочник.Command.КомандаСправоник",
      type: "Auto",
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
    },
  ],
  CommandBar: [
    {
      command: "Catalog.ПодчиненныйСправочник.StandardCommand.CreateBasedOn",
      type: "Auto",
      defaultVisible: false,
    },
  ],
}

export const fullCommandInterfaceEnterprise: CommandInterfaceEnterprise = {
  ПанельНавигации: [
    {
      Команда: "Catalog.ПодчиненныйСправочник.StandardCommand.OpenByValue",
      Тип: "Auto",
      ГруппаКоманд: "ПанельНавигацииФормыПерейти",
      Автовидимость: "Истина",
    },
    {
      Команда: "Catalog.ПримерСправочник.Command.КомандаСправочник2",
      Тип: "Auto",
      ГруппаКоманд: "ПанельНавигацииФормыПерейти",
      Автовидимость: "Ложь",
    },
    {
      Команда: "Catalog.ПримерСправочник.Command.КомандаСправоник",
      Тип: "Auto",
      ГруппаКоманд: "ПанельНавигацииФормыПерейти",
      Автовидимость: "Ложь",
      РазрешитьИспользование: {
        "Администратор": "Истина",
      },
    },
  ],
  КоманднаяПанель: [
    {
      Команда: "Catalog.ПодчиненныйСправочник.StandardCommand.CreateBasedOn",
      Тип: "Auto",
      Автовидимость: "Ложь",
    },
  ],
}
