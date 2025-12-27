import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/packages/core/metadata/commonObjects/i8nText/types"
import {
  MetadataAttributes,
  MetadataAttributesEnterprise,
  MetadataAttributesXML,
} from "~/packages/core/metadata/commonObjects/metadataAttribute/types"
import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
  StandardAttributeDescriptionsXML,
} from "~/packages/core/metadata/commonObjects/standardAttributeDescription/types"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"
import { InternalInfoItemsXML } from "../internalInfo/types"
import { MetadataName } from "../metadataName/types"

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

export type TabularSectionInternalInfoParamsXML = [
  { name: string; category: "TabularSection" },
  { name: string; category: "TabularSectionRow" },
]

export interface MetadataTabularSectionXML {
  _uuid?: string
  InternalInfo?: InternalInfoItemsXML<TabularSectionInternalInfoParamsXML>
  Properties: {
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
  ChildObjects?: {
    Attribute?: MetadataAttributesXML
  }
}

export interface MetadataTabularSectionEnterprise {
  ДлинаНомераСтроки?: number
  Использование?: SE.AttributeUseEnterprise
  Комментарий?: string
  Подсказка?: I8nTextEnterprise
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  ПроверкаЗаполнения?: SE.FillCheckingEnterprise
  Реквизиты?: MetadataAttributesEnterprise
  Синоним?: I8nTextEnterprise
  СтандартныеРеквизиты?: StandardAttributeDescriptionsEnterprise
}

export type MetadataTabularSections = MetadataTabularSection[]

export type MetadataTabularSectionsXML = MetadataTabularSectionXML[]

export type MetadataTabularSectionsEnterprise = Record<MetadataName, MetadataTabularSectionEnterprise>
