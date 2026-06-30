import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Static, Type } from "@sinclair/typebox"
import { StringboolYAML, StringboolXML } from "~/metadata/commonObjects/boolean/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksYAML } from "~/metadata/commonObjects/metadataRef/types"
import { MetadataItem } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { RootCommandInterfaceRules } from "./rules"

export type CommandInterfacePlacement = "Auto" | "Manual" | string
export type CommandInterfaceCommandGroup = string

export interface CommandInterfaceVisibility {
  common?: boolean
  roles?: Record<MetadataItemLink, boolean>
}

export interface CommandInterfaceVisibilityItem {
  command: string
  visibility: CommandInterfaceVisibility
}

export type CommandInterfaceVisibilityMap = CommandInterfaceVisibilityItem[]

export type CommandInterfaceSubsystemsVisibilityMap = Record<string, CommandInterfaceVisibility>

export interface CommandInterfacePlacementItem {
  command: string
  commandGroup?: CommandInterfaceCommandGroup
  placement?: CommandInterfacePlacement
}

export type CommandInterfacePlacementMap = CommandInterfacePlacementItem[]

export interface CommandInterfaceOrderItem {
  command: string
  commandGroup: CommandInterfaceCommandGroup
}

export type CommandInterfaceOrder = CommandInterfaceOrderItem[]

export interface CommandInterfaceVisibilityXML {
  Visibility?: {
    "xr:Common"?: StringboolXML
    "xr:Value"?: CommandInterfaceRoleVisibilityXML | CommandInterfaceRoleVisibilityXML[]
  }
  _name?: string
  name?: string
}

export interface CommandInterfaceRoleVisibilityXML {
  _name?: string
  name?: string
  "#text"?: StringboolXML
}

export interface CommandInterfaceVisibilityMapXML {
  Command?: CommandInterfaceVisibilityXML | CommandInterfaceVisibilityXML[]
  Subsystem?: CommandInterfaceVisibilityXML | CommandInterfaceVisibilityXML[]
}

export interface CommandInterfacePlacementXML {
  CommandGroup?: string
  Placement?: string
  _name?: string
  name?: string
}

export interface CommandInterfacePlacementMapXML {
  Command?: CommandInterfacePlacementXML | CommandInterfacePlacementXML[]
}

export interface CommandInterfaceOrderXMLItem {
  CommandGroup?: string
  _name?: string
  name?: string
}

export interface CommandInterfaceOrderXML {
  Command?: CommandInterfaceOrderXMLItem | CommandInterfaceOrderXMLItem[]
}

export const CommandInterfaceVisibilityJSONSchema = Type.Object({
  Общее: Type.Optional(Type.Union([Type.Literal("Истина"), Type.Literal("Ложь")])),
  Роли: Type.Optional(Type.Record(Type.String(), Type.Union([Type.Literal("Истина"), Type.Literal("Ложь")]))),
})

export const CommandInterfaceVisibilityItemJSONSchema = Type.Intersect([
  Type.Object({ Команда: Type.String() }),
  CommandInterfaceVisibilityJSONSchema,
])

export const CommandInterfaceVisibilityMapJSONSchema = Type.Array(CommandInterfaceVisibilityItemJSONSchema)

export const CommandInterfaceSubsystemsVisibilityMapJSONSchema = Type.Record(
  Type.String(),
  CommandInterfaceVisibilityJSONSchema
)

export const CommandInterfacePlacementItemJSONSchema = Type.Object({
  Команда: Type.String(),
  ГруппаКоманд: Type.Optional(Type.String()),
  Размещение: Type.Optional(Type.String()),
})

export const CommandInterfacePlacementMapJSONSchema = Type.Array(CommandInterfacePlacementItemJSONSchema)

export const CommandInterfaceOrderItemJSONSchema = Type.Object({
  Команда: Type.String(),
  ГруппаКоманд: Type.String(),
})

export const CommandInterfaceOrderJSONSchema = Type.Array(CommandInterfaceOrderItemJSONSchema)

export type CommandInterfaceVisibilityMapYAML = Array<{
  Команда: string
  Общее?: StringboolYAML
  Роли?: Record<string, StringboolYAML>
}>

export interface CommandInterfaceVisibilityYAML {
  Общее?: StringboolYAML
  Роли?: Record<string, StringboolYAML>
}

export type CommandInterfaceSubsystemsVisibilityMapYAML = Record<string, CommandInterfaceVisibilityYAML>

export type CommandInterfacePlacementMapYAML = Array<{
  Команда: string
  ГруппаКоманд?: string
  Размещение?: string
}>

export type CommandInterfaceOrderYAML = Static<typeof CommandInterfaceOrderJSONSchema>

export type CommandInterfaceMetadataItemLinks = MetadataItemLinks
export type CommandInterfaceMetadataItemLinksYAML = MetadataItemLinksYAML
export type CommandInterfaceSubsystemsOrder = MetadataItemLinks
export type CommandInterfaceSubsystemsOrderYAML = MetadataItemLinksYAML
export type CommandInterfaceCommandGroups = string[]
export type CommandInterfaceCommandGroupsYAML = string[]

export type RootCommandInterface = MetadataTypeByRule<typeof RootCommandInterfaceRules> & MetadataItem
export type RootCommandInterfaceYAML = YAMLTypeByRule<typeof RootCommandInterfaceRules>

export interface CommandInterfaceCommandGroupsWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfaceCommandGroups"
}

export type CommandInterfaceCommandGroupsRuleParams = Omit<CommandInterfaceCommandGroupsWidePropertyRule, "type">

export function commandInterfaceCommandGroupsRule<const Params extends CommandInterfaceCommandGroupsRuleParams>(
  params: WideExactRuleParams<CommandInterfaceCommandGroupsRuleParams, Params>
): Readonly<{ type: "CommandInterfaceCommandGroups" } & Params> {
  return defineWidePropertyRule("CommandInterfaceCommandGroups", params)
}
export interface CommandInterfaceOrderWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfaceOrder"
}

export type CommandInterfaceOrderRuleParams = Omit<CommandInterfaceOrderWidePropertyRule, "type">

export function commandInterfaceOrderRule<const Params extends CommandInterfaceOrderRuleParams>(
  params: WideExactRuleParams<CommandInterfaceOrderRuleParams, Params>
): Readonly<{ type: "CommandInterfaceOrder" } & Params> {
  return defineWidePropertyRule("CommandInterfaceOrder", params)
}
export interface CommandInterfacePlacementMapWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfacePlacementMap"
}

export type CommandInterfacePlacementMapRuleParams = Omit<CommandInterfacePlacementMapWidePropertyRule, "type">

export function commandInterfacePlacementMapRule<const Params extends CommandInterfacePlacementMapRuleParams>(
  params: WideExactRuleParams<CommandInterfacePlacementMapRuleParams, Params>
): Readonly<{ type: "CommandInterfacePlacementMap" } & Params> {
  return defineWidePropertyRule("CommandInterfacePlacementMap", params)
}
export interface CommandInterfaceSubsystemsOrderWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfaceSubsystemsOrder"
}

export type CommandInterfaceSubsystemsOrderRuleParams = Omit<CommandInterfaceSubsystemsOrderWidePropertyRule, "type">

export function commandInterfaceSubsystemsOrderRule<const Params extends CommandInterfaceSubsystemsOrderRuleParams>(
  params: WideExactRuleParams<CommandInterfaceSubsystemsOrderRuleParams, Params>
): Readonly<{ type: "CommandInterfaceSubsystemsOrder" } & Params> {
  return defineWidePropertyRule("CommandInterfaceSubsystemsOrder", params)
}
export interface CommandInterfaceSubsystemsVisibilityMapWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfaceSubsystemsVisibilityMap"
}

export type CommandInterfaceSubsystemsVisibilityMapRuleParams = Omit<
  CommandInterfaceSubsystemsVisibilityMapWidePropertyRule,
  "type"
>

export function commandInterfaceSubsystemsVisibilityMapRule<
  const Params extends CommandInterfaceSubsystemsVisibilityMapRuleParams,
>(
  params: WideExactRuleParams<CommandInterfaceSubsystemsVisibilityMapRuleParams, Params>
): Readonly<{ type: "CommandInterfaceSubsystemsVisibilityMap" } & Params> {
  return defineWidePropertyRule("CommandInterfaceSubsystemsVisibilityMap", params)
}
export interface CommandInterfaceVisibilityMapWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfaceVisibilityMap"
}

export type CommandInterfaceVisibilityMapRuleParams = Omit<CommandInterfaceVisibilityMapWidePropertyRule, "type">

export function commandInterfaceVisibilityMapRule<const Params extends CommandInterfaceVisibilityMapRuleParams>(
  params: WideExactRuleParams<CommandInterfaceVisibilityMapRuleParams, Params>
): Readonly<{ type: "CommandInterfaceVisibilityMap" } & Params> {
  return defineWidePropertyRule("CommandInterfaceVisibilityMap", params)
}
