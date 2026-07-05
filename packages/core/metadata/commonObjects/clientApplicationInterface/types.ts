import { Type } from "@sinclairtypebox"
import type { Static } from "@sinclairtypebox"
import { MetadataItem } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import type { SectionsPanelRepresentation } from "../../systemEnumerations/types"
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
