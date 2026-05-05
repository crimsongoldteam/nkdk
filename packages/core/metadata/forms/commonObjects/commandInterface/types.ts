import { Static, Type } from "@sinclair/typebox"
import { BooleanJSONSchema } from "~/metadata/commonObjects/boolean/types"
import { UserVisible, UserVisibleJSONSchema, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { MetadataItem } from "~/metadata/orchestration"
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

type CommandInterfaceItems = CommandInterfaceItem[]

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

const standardCommandsGroupsYAML = Object.keys(SE.StandardCommandsGroupFromYAML) as SE.StandardCommandsGroupYAML[]
const standardCommandsGroups = standardCommandsGroupsYAML.map((key) => Type.Literal(key))

export const CommandInterfaceItemJSONSchema = Type.Object({
  Команда: Type.String(),
  Тип: Type.Optional(Type.String()),
  ГруппаКоманд: Type.Optional(Type.Union(standardCommandsGroups)),
  Автовидимость: BooleanJSONSchema,
  РазрешитьИспользование: Type.Optional(UserVisibleJSONSchema),
  ЗапретитьИспользование: Type.Optional(UserVisibleJSONSchema),
})

export const CommandInterfaceJSONSchema = Type.Object({
  ПанельНавигации: Type.Optional(Type.Array(CommandInterfaceItemJSONSchema)),
  КоманднаяПанель: Type.Optional(Type.Array(CommandInterfaceItemJSONSchema)),
})

export type CommandInterfaceYAML = Static<typeof CommandInterfaceJSONSchema>

export type CommandInterfaceItemYAML = Static<typeof CommandInterfaceItemJSONSchema>

//#endregion
