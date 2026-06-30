import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Static, Type } from "@sinclair/typebox"
import { MetadataItem } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import type { SectionsPanelRepresentation } from "~/metadata/systemEnumerations/types"
import { ClientApplicationInterfaceRules } from "./rules"

export type ClientApplicationInterfaceStandardPanel =
  | "ПанельИстории"
  | "ПанельРазделов"
  | "ПанельФункцийТекущегоРаздела"
  | "ПанельОткрытых"
  | "ПанельИзбранного"
  | "СтандартнаяПанель"

export interface ClientApplicationInterfacePanel {
  kind: "panel"
  id?: string
  uuid?: string
  name?: string
  height?: number
  spr?: SectionsPanelRepresentation
}

export interface ClientApplicationInterfaceGroup {
  kind: "group"
  id?: string
  items?: ClientApplicationInterfaceItem[]
}

export type ClientApplicationInterfaceItem = ClientApplicationInterfacePanel | ClientApplicationInterfaceGroup
export type ClientApplicationInterfaceItems = ClientApplicationInterfaceItem[]

export interface ClientApplicationInterfacePanelDef {
  id: string
  name?: string
  spr?: SectionsPanelRepresentation
}

export type ClientApplicationInterfacePanelDefs = ClientApplicationInterfacePanelDef[]

export interface ClientApplicationInterfacePanelXML {
  _id?: string
  id?: string
  uuid?: string
  name?: string
  height?: string | number
}

export interface ClientApplicationInterfaceGroupXML {
  _id?: string
  id?: string
  panel?: ClientApplicationInterfacePanelXML | ClientApplicationInterfacePanelXML[]
  group?: ClientApplicationInterfaceGroupXML | ClientApplicationInterfaceGroupXML[]
}

export interface ClientApplicationInterfaceSectionXML {
  panel?: ClientApplicationInterfacePanelXML | ClientApplicationInterfacePanelXML[]
  group?: ClientApplicationInterfaceGroupXML | ClientApplicationInterfaceGroupXML[]
}

export interface ClientApplicationInterfacePanelDefXML {
  _id?: string
  id?: string
  name?: string
  spr?: SectionsPanelRepresentation
}

export const ClientApplicationInterfacePanelYAMLSchema = Type.Object({
  Имя: Type.Optional(Type.String()),
  UUID: Type.Optional(Type.String()),
  Высота: Type.Optional(Type.Number()),
  Представление: Type.Optional(Type.String()),
})

export const ClientApplicationInterfaceItemYAMLSchema = Type.Recursive((This) =>
  Type.Union([
    Type.Object({
      Панель: Type.Union([Type.String(), ClientApplicationInterfacePanelYAMLSchema]),
    }),
    Type.Object({
      Группа: Type.Object({
        Элементы: Type.Optional(Type.Array(This)),
      }),
    }),
  ])
)

export const ClientApplicationInterfaceItemsYAMLSchema = Type.Array(ClientApplicationInterfaceItemYAMLSchema)

export type ClientApplicationInterfacePanelYAML = Static<typeof ClientApplicationInterfacePanelYAMLSchema>
export type ClientApplicationInterfaceItemYAML = Static<typeof ClientApplicationInterfaceItemYAMLSchema>
export type ClientApplicationInterfaceItemsYAML = Static<typeof ClientApplicationInterfaceItemsYAMLSchema>

export type ClientApplicationInterface = MetadataTypeByRule<typeof ClientApplicationInterfaceRules> & MetadataItem
export type ClientApplicationInterfaceYAML = YAMLTypeByRule<typeof ClientApplicationInterfaceRules>

export interface ClientApplicationInterfaceItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "ClientApplicationInterfaceItems"
}

export type ClientApplicationInterfaceItemsRuleParams = Omit<ClientApplicationInterfaceItemsWidePropertyRule, "type">

export function clientApplicationInterfaceItemsRule<const Params extends ClientApplicationInterfaceItemsRuleParams>(
  params: WideExactRuleParams<ClientApplicationInterfaceItemsRuleParams, Params>
): Readonly<{ type: "ClientApplicationInterfaceItems" } & Params> {
  return defineWidePropertyRule("ClientApplicationInterfaceItems", params)
}
export interface ClientApplicationInterfacePanelDefsWidePropertyRule extends WidePropertyRuleBase {
  type: "ClientApplicationInterfacePanelDefs"
}

export type ClientApplicationInterfacePanelDefsRuleParams = Omit<
  ClientApplicationInterfacePanelDefsWidePropertyRule,
  "type"
>

export function clientApplicationInterfacePanelDefsRule<
  const Params extends ClientApplicationInterfacePanelDefsRuleParams,
>(
  params: WideExactRuleParams<ClientApplicationInterfacePanelDefsRuleParams, Params>
): Readonly<{ type: "ClientApplicationInterfacePanelDefs" } & Params> {
  return defineWidePropertyRule("ClientApplicationInterfacePanelDefs", params)
}
