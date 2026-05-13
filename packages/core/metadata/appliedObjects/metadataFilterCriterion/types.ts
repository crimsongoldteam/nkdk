import { MetadataCommandsXML } from "~/metadata/appliedObjects/metadataCommand/types"
import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { InternalInfoItemsXML } from "~/metadata/commonObjects/internalInfo/types"
import { MetadataItemLinksXML } from "~/metadata/commonObjects/metadataRef/types"
import { TypeDescriptionXML } from "~/metadata/commonObjects/typeDescription/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataFilterCriterionRules } from "./rules"

export type MetadataFilterCriterion = MetadataTypeByRule<typeof MetadataFilterCriterionRules>
export type MetadataFilterCriterionYAML = YAMLTypeByRule<typeof MetadataFilterCriterionRules>

export type FilterCriterionInternalInfoParamsXML = [
  { name: string; category: "Manager" },
  { name: string; category: "List" },
]

export interface MetadataFilterCriterionXML {
  _version: string
  FilterCriterion: {
    _uuid: string
    InternalInfo: InternalInfoItemsXML<FilterCriterionInternalInfoParamsXML> | undefined
    Properties: {
      AuxiliaryForm?: string
      Comment?: string
      Content?: MetadataItemLinksXML
      DefaultForm?: string
      Explanation?: I8nTextXML
      ExtendedConfigurationObject?: string
      ExtendedListPresentation?: I8nTextXML
      ListPresentation?: I8nTextXML
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      Synonym?: I8nTextXML
      Type?: TypeDescriptionXML
      UseStandardCommands?: boolean
    }
    ChildObjects?: {
      Command?: MetadataCommandsXML
      Form?: string | string[]
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataFilterCriterion",
  itemRule: MetadataFilterCriterionRules,
})
