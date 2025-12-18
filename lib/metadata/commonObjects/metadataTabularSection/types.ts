import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import {
  MetadataAttributes,
  MetadataAttributesEnterprise,
  MetadataAttributesXML,
} from "~/lib/metadata/commonObjects/metadataAttribute/types"
import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
  StandardAttributeDescriptionsXML,
} from "~/lib/metadata/commonObjects/standardAttributeDescription/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface MetadataTabularSection {
  attributes?: MetadataAttributes
  comment?: string
  fillChecking?: SE.FillChecking
  lineNumberLength?: number
  name: string
  objectBelonging?: SE.ObjectBelonging
  standardAttributes?: StandardAttributeDescriptions
  synonym?: I8nText
  tooltip?: I8nText
  use?: SE.AttributeUse
}

export interface MetadataTabularSectionXML {
  Attributes?: MetadataAttributesXML
  Comment?: string
  FillChecking?: SE.FillChecking
  LineNumberLength?: number
  Name: string
  ObjectBelonging?: SE.ObjectBelonging
  StandardAttributes?: StandardAttributeDescriptionsXML
  Synonym?: I8nTextXML
  Tooltip?: I8nTextXML
  Use?: SE.AttributeUse
}

export interface MetadataTabularSectionEnterprise {
  Реквизиты?: MetadataAttributesEnterprise
  Комментарий?: string
  ПроверкаЗаполнения?: SE.FillCheckingEnterprise
  ДлинаНомераСтроки?: number
  Имя?: string
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  СтандартныеРеквизиты?: StandardAttributeDescriptionsEnterprise
  Синоним?: I8nTextEnterprise
  Подсказка?: I8nTextEnterprise
  Использование?: SE.AttributeUseEnterprise
}

export type MetadataTabularSections = MetadataTabularSection[]

export type MetadataTabularSectionsXML = MetadataTabularSectionXML[]

export type MetadataTabularSectionsEnterprise = Record<string, MetadataTabularSectionEnterprise>
