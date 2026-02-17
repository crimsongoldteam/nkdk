import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { MetadataItem } from "~/metadata/metadataFactory"
import * as SE from "~/metadata/systemEnumerations/types"

//#region inner

export interface CommandInterface extends MetadataItem {
  itemType: "CommandInterface"
  NavigationPanel: CommandInterfaceItems
  CommandBar: CommandInterfaceItems
}

export interface CommandInterfaceItem extends MetadataItem {
  itemType: "CommandInterfaceItem"
  command: string
  type?: string
  commandGroup?: SE.StandardCommandsGroup
  defaultVisible: boolean
  visible?: UserVisible
}

//#endregion

//#region xml

export interface CommandInterfaceXML {
  NavigationPanel?: {
    Item?: CommandInterfaceItemXML[] | CommandInterfaceItemXML
  }
  CommandBar?: {
    Item?: CommandInterfaceItemXML[] | CommandInterfaceItemXML
  }
}

export interface CommandInterfaceItemXML {
  Command: string
  Type: string
  CommandGroup?: SE.StandardCommandsGroup
  Index?: number
  DefaultVisible?: boolean
  Visible?: UserVisibleXML
}

//#endregion

//#region enterprise

type CommandInterfaceItems = CommandInterfaceItem[]

export interface CommandInterfaceEnterprise {
  ПанельНавигации?: CommandInterfaceItemsEnterprise
  КоманднаяПанель?: CommandInterfaceItemsEnterprise
}

export interface CommandInterfaceItemEnterprise {
  Команда: string
  Тип?: string
  ГруппаКоманд?: SE.StandardCommandsGroupEnterprise
  Автовидимость: StringboolEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
}

type CommandInterfaceItemsEnterprise = CommandInterfaceItemEnterprise[]

//#endregion
