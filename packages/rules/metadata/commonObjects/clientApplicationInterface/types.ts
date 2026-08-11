import { Type } from "typebox"
import { MetadataItem } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import type { SectionsPanelRepresentation } from "../../systemEnumerations/types"
import { ClientApplicationInterfaceRules } from "./rules"
import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"

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

const clientApplicationInterfacePanelYAMLSchema = (includeXMLTransport: boolean) =>
  Type.Object({
    Имя: Type.Optional(Type.String()),
    UUID: Type.Optional(includeXMLTransport ? Type.String({ format: "uuid" }) : Type.String()),
    Высота: Type.Optional(Type.Number()),
    Представление: Type.Optional(Type.String()),
    ...(includeXMLTransport
      ? { ПустоеОпределение: Type.Optional(Type.Literal(EMPTY_XML_TAG_VALUE)) }
      : {}),
  })

const clientApplicationInterfaceItemsYAMLSchema = (includeXMLTransport: boolean) => {
  const panel = clientApplicationInterfacePanelYAMLSchema(includeXMLTransport)
  const item = Type.Cyclic(
    {
      ClientApplicationInterfaceItem: Type.Union([
        Type.Object({ Панель: Type.Union([Type.String(), panel]) }),
        Type.Object({
          Группа: Type.Object({
            Элементы: Type.Optional(Type.Array(Type.Ref("ClientApplicationInterfaceItem"))),
          }),
        }),
      ]),
    },
    "ClientApplicationInterfaceItem"
  )
  return Type.Array(item)
}

export const ClientApplicationInterfaceItemsValidationYAMLSchema =
  clientApplicationInterfaceItemsYAMLSchema(true)
export const ClientApplicationInterfaceItemsHintYAMLSchema =
  clientApplicationInterfaceItemsYAMLSchema(false)

export interface ClientApplicationInterfacePanelYAML {
  Имя?: string
  UUID?: string
  Высота?: number
  Представление?: string
  ПустоеОпределение?: typeof EMPTY_XML_TAG_VALUE
}

export type ClientApplicationInterfaceItemYAML =
  | { Панель: string | ClientApplicationInterfacePanelYAML }
  | { Группа: { Элементы?: ClientApplicationInterfaceItemsYAML } }
export type ClientApplicationInterfaceItemsYAML = ClientApplicationInterfaceItemYAML[]

export type ClientApplicationInterface = MetadataTypeByRule<typeof ClientApplicationInterfaceRules> & MetadataItem
export type ClientApplicationInterfaceYAML = YAMLTypeByRule<typeof ClientApplicationInterfaceRules>
