import { MetadataCommandsXML } from "../metadataCommand/types"
import { I8nTextXML } from "../../commonObjects/i8nText/types"
import { InternalInfoItemsXML } from "../../commonObjects/internalInfo/types"
import { MetadataItemLinksXML } from "../../commonObjects/metadataRef/types"
import { TypeDescriptionXML } from "../../commonObjects/typeDescription/types"
import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
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
