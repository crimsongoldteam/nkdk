import {
  UserVisible,
  UserVisibleEnterprise,
  UserVisibleKeysEnterprise,
  UserVisibleXML,
} from "~/metadata/commonObjects/userVisible/types"
import * as SE from "~/metadata/systemEnumerations/types"

//#region inner

export interface CommandInterface {
  NavigationPanel: CommandInterfaceItems
  CommandBar: CommandInterfaceItems
}

interface CommandInterfaceItem {
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

interface CommandInterfaceItemXML {
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
  Автовидимость: boolean
  [UserVisibleKeysEnterprise.Allow]?: UserVisibleEnterprise
  [UserVisibleKeysEnterprise.Deny]?: UserVisibleEnterprise
}

type CommandInterfaceItemsEnterprise = CommandInterfaceItemEnterprise[]

//#endregion
