import type { CommandInterface, CommandInterfaceYAML } from "../types"

export const fullCommandInterface: CommandInterface = {
  itemType: "CommandInterface",
  NavigationPanel: [
    {
      command: "InformationRegister.РегистрСведенийКомандныйИнтерфейс.StandardCommand.OpenByValue.Измерение1",
      type: "Auto",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormNavigationPanelImportant",
      defaultVisible: false,
      visible: { common: false, values: [] },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormNavigationPanelSeeAlso",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "InformationRegister.РегистрСведенийКомандныйИнтерфейс1.StandardCommand.OpenByValue.Измерение1",
      type: "Auto",
      attribute: "Объект.Ref",
      commandGroup: "FormNavigationPanelGoTo",
      itemType: "CommandInterfaceItem",
    },
  ],
  CommandBar: [
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
      visible: { common: false, values: [] },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormCommandBarCreateBasedOn",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
  ],
}

export const fullCommandInterfaceFromYAML: CommandInterface = {
  itemType: "CommandInterface",
  NavigationPanel: [
    {
      command: "InformationRegister.РегистрСведенийКомандныйИнтерфейс.StandardCommand.OpenByValue.Измерение1",
      type: "Auto",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormNavigationPanelImportant",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormNavigationPanelSeeAlso",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "InformationRegister.РегистрСведенийКомандныйИнтерфейс1.StandardCommand.OpenByValue.Измерение1",
      type: "Auto",
      attribute: "Объект.Ref",
      commandGroup: "FormNavigationPanelGoTo",
      itemType: "CommandInterfaceItem",
    },
  ],
  CommandBar: [
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      type: "Added",
      commandGroup: "FormCommandBarCreateBasedOn",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
  ],
}

export const fullCommandInterfaceYAML: CommandInterfaceYAML = {
  ПанельНавигации: [
    {
      Команда: "InformationRegister.РегистрСведенийКомандныйИнтерфейс.StandardCommand.OpenByValue.Измерение1",
      Тип: "Auto",
      Автовидимость: "Ложь",
    },
    {
      Команда: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      Тип: "Added",
      ГруппаКоманд: "ПанельНавигацииФормыВажное",
      Автовидимость: "Ложь",
    },
    {
      Команда: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      Тип: "Added",
      ГруппаКоманд: "ПанельНавигацииФормыСмТакже",
      Автовидимость: "Ложь",
    },
    {
      Команда: "InformationRegister.РегистрСведенийКомандныйИнтерфейс1.StandardCommand.OpenByValue.Измерение1",
      Тип: "Auto",
      Реквизит: "Объект.Ref",
      ГруппаКоманд: "ПанельНавигацииФормыПерейти",
    },
  ],
  КоманднаяПанель: [
    {
      Команда: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      Тип: "Added",
      ГруппаКоманд: "КоманднаяПанельФормыВажное",
      Автовидимость: "Ложь",
    },
    {
      Команда: "Catalog.СправочникCоВсемиОбъектами.Command.КомандаОбъекта",
      Тип: "Added",
      ГруппаКоманд: "КоманднаяПанельФормыСоздатьНаОсновании",
      Автовидимость: "Ложь",
    },
  ],
}
