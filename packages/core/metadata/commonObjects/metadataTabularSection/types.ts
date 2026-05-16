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

export type MetadataTaskTabularSection = MetadataTabularSection
export type MetadataTaskTabularSections = MetadataTabularSections
export type MetadataTaskTabularSectionsXML = MetadataTabularSectionsXML
export type MetadataTaskTabularSectionsYAML = MetadataTabularSectionsYAML

export type MetadataBusinessProcessTabularSection = MetadataTabularSection
export type MetadataBusinessProcessTabularSections = MetadataTabularSections
export type MetadataBusinessProcessTabularSectionsXML = MetadataTabularSectionsXML
export type MetadataBusinessProcessTabularSectionsYAML = MetadataTabularSectionsYAML

export type MetadataDataProcessorTabularSection = MetadataTabularSection
export type MetadataDataProcessorTabularSections = MetadataTabularSections
export type MetadataDataProcessorTabularSectionsXML = MetadataTabularSectionsXML
export type MetadataDataProcessorTabularSectionsYAML = MetadataTabularSectionsYAML

export type MetadataReportTabularSection = MetadataTabularSection
export type MetadataReportTabularSections = MetadataTabularSections
export type MetadataReportTabularSectionsXML = MetadataTabularSectionsXML
export type MetadataReportTabularSectionsYAML = MetadataTabularSectionsYAML

export type MetadataExchangePlanTabularSection = MetadataTabularSection
export type MetadataExchangePlanTabularSections = MetadataTabularSections
export type MetadataExchangePlanTabularSectionsXML = MetadataTabularSectionsXML
export type MetadataExchangePlanTabularSectionsYAML = MetadataTabularSectionsYAML

export type MetadataChartOfAccountsTabularSection = MetadataTabularSection
export type MetadataChartOfAccountsTabularSections = MetadataTabularSections
export type MetadataChartOfAccountsTabularSectionsXML = MetadataTabularSectionsXML
export type MetadataChartOfAccountsTabularSectionsYAML = MetadataTabularSectionsYAML

export type MetadataChartOfCalculationTypesTabularSection = MetadataTabularSection
export type MetadataChartOfCalculationTypesTabularSections = MetadataTabularSections
export type MetadataChartOfCalculationTypesTabularSectionsXML = MetadataTabularSectionsXML
export type MetadataChartOfCalculationTypesTabularSectionsYAML = MetadataTabularSectionsYAML

export type MetadataChartOfCharacteristicTypesTabularSection = MetadataTabularSection
export type MetadataChartOfCharacteristicTypesTabularSections = MetadataTabularSections
export type MetadataChartOfCharacteristicTypesTabularSectionsXML = MetadataTabularSectionsXML
export type MetadataChartOfCharacteristicTypesTabularSectionsYAML = MetadataTabularSectionsYAML
