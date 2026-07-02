import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Type } from "@sinclair/typebox"
import type { Static } from "@sinclair/typebox"
import { StringboolXML } from "~/metadata/commonObjects/boolean/types"
import { DataPath, DataPathXML, DataPathYAML } from "~/metadata/forms/commonObjects/dataPath/types"
import { UserVisible, UserVisibleJSONSchema, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { MetadataItem } from "~/metadata/orchestration"
import * as SE from "~/metadata/systemEnumerations/types"

type RawCommandGroup = string

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
  attribute?: DataPath
  index?: number
  commandGroup?: SE.StandardCommandsGroup | RawCommandGroup
  defaultVisible?: false
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
  Attribute?: DataPathXML
  CommandGroup?: SE.StandardCommandsGroup | RawCommandGroup
  Index?: number | string
  DefaultVisible?: StringboolXML
  Visible?: UserVisibleXML
}

//#endregion

//#region enterprise

export const CommandInterfaceItemJSONSchema = Type.Object({
  Команда: Type.String(),
  Тип: Type.Optional(Type.String()),
  Реквизит: Type.Optional(Type.String()),
  Индекс: Type.Optional(Type.Number()),
  ГруппаКоманд: Type.Optional(Type.String()),
  Автовидимость: Type.Optional(Type.Literal("Ложь")),
  Использование: Type.Optional(UserVisibleJSONSchema),
})

export const CommandInterfaceJSONSchema = Type.Object({
  ПанельНавигации: Type.Optional(Type.Array(CommandInterfaceItemJSONSchema)),
  КоманднаяПанель: Type.Optional(Type.Array(CommandInterfaceItemJSONSchema)),
})

export type CommandInterfaceYAML = Static<typeof CommandInterfaceJSONSchema>

export type CommandInterfaceItemYAML = Static<typeof CommandInterfaceItemJSONSchema> & {
  Реквизит?: DataPathYAML
}

//#endregion

export interface CommandInterfaceWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterface"
}

export type CommandInterfaceRuleParams = Omit<CommandInterfaceWidePropertyRule, "type">

export function commandInterfaceRule<const Params extends CommandInterfaceRuleParams>(
  params: WideExactRuleParams<CommandInterfaceRuleParams, Params>
): Readonly<{ type: "CommandInterface" } & Params> {
  return defineWidePropertyRule("CommandInterface", params)
}
