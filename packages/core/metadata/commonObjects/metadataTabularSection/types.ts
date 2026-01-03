import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import {
  MetadataAttributes,
  MetadataAttributesEnterprise,
  MetadataAttributesXML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
  StandardAttributeDescriptionsXML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import * as SE from "~/metadata/systemEnumerations/types"
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
  synonym: I8nText
  toolTip?: I8nText
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
    Name: string
    Comment?: string
    FillChecking?: SE.FillChecking
    LineNumberLength?: number
    ObjectBelonging?: SE.ObjectBelonging
    StandardAttributes?: StandardAttributeDescriptionsXML
    Synonym?: I8nTextXML
    ToolTip?: I8nTextXML
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
