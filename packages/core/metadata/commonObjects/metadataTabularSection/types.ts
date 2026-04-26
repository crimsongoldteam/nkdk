import { I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataAttributesXML, MetadataAttributesYAML } from "~/metadata/commonObjects/metadataAttribute/types"
import {
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionsYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import * as SE from "~/metadata/systemEnumerations/types"
import { InternalInfoItemsXML } from "../internalInfo/types"
import { MetadataNameYAML } from "../metadataName/types"
import { MetadataTabularSectionRules } from "./rules"

export type MetadataTabularSection = MetadataTypeByRule<typeof MetadataTabularSectionRules>

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

export interface MetadataTabularSectionYAML {
  ДлинаНомераСтроки?: number
  Использование?: SE.AttributeUseYAML
  Комментарий?: string
  Подсказка?: I8nTextYAML
  ПринадлежностьОбъекта?: SE.ObjectBelongingYAML
  ПроверкаЗаполнения?: SE.FillCheckingYAML
  Реквизиты?: MetadataAttributesYAML
  Синоним?: I8nTextYAML
  СтандартныеРеквизиты?: StandardAttributeDescriptionsYAML
}

export type MetadataTabularSections = MetadataTabularSection[]

export type MetadataTabularSectionsXML = MetadataTabularSectionXML[]

export type MetadataTabularSectionsYAML = Record<MetadataNameYAML, MetadataTabularSectionYAML>

export type MetadataDocumentTabularSection = MetadataTabularSection
export type MetadataDocumentTabularSections = MetadataTabularSections
export type MetadataDocumentTabularSectionsXML = MetadataTabularSectionsXML
export type MetadataDocumentTabularSectionsYAML = MetadataTabularSectionsYAML
