import { I8nTextXML } from "../i8nText/types"
import { MetadataValueXML } from "../metadataValue/types"
import { TypeDescriptionXML } from "../typeDescription/types"
import { TypeLinkXML } from "../typeLink/types"
import { ChoiceParameterLinksXML } from "../сhoiceParameterLinks/types"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
import { ChoiceParametersXML } from "../сhoiceParameters/types"
import { StandardAttributeDescriptionRules } from "./rules"
import type { StandartAttributeName, StandartAttributeYAML } from "./standartAttributeNames"

export { StandartAttributeNameFromYAML, StandartAttributeNameToYAML } from "./standartAttributeNames"
export type { StandartAttributeName, StandartAttributeYAML } from "./standartAttributeNames"

// export const PredefinedNameToYAML

export type StandardAttributeDescription = MetadataTypeByRule<typeof StandardAttributeDescriptionRules>

export interface StandardAttributeDescriptionXML {
  _name: StandartAttributeName
  "xr:ChoiceForm"?: string
  "xr:ChoiceHistoryOnInput"?: SE.ChoiceHistoryOnInput
  "xr:ChoiceParameterLinks"?: ChoiceParameterLinksXML
  "xr:ChoiceParameters"?: ChoiceParametersXML
  "xr:Comment"?: string
  "xr:CreateOnInput"?: SE.CreateOnInput
  "xr:DataHistory"?: SE.DataHistoryUse
  "xr:EditFormat"?: I8nTextXML
  "xr:ExtendedEdit"?: boolean
  "xr:FillChecking"?: SE.FillChecking
  "xr:FillFromFillingValue"?: boolean
  "xr:FillValue"?: MetadataValueXML
  "xr:Format"?: I8nTextXML
  "xr:FullTextSearch"?: SE.UseFullTextSearch
  "xr:LinkByType"?: TypeLinkXML
  "xr:MarkNegatives"?: boolean
  "xr:Mask"?: string
  "xr:MaxValue"?: number
  "xr:MinValue"?: number
  "xr:MultiLine"?: boolean
  "xr:PasswordMode"?: boolean
  "xr:QuickChoice"?: SE.UseQuickChoice
  "xr:Synonym"?: I8nTextXML
  "xr:ToolTip"?: I8nTextXML
  "xr:Type"?: TypeDescriptionXML
  "xr:TypeReductionMode"?: SE.TypeReductionMode
}

export type StandardAttributeDescriptionYAML = YAMLTypeByRule<typeof StandardAttributeDescriptionRules>

export type StandardAttributeDescriptions = StandardAttributeDescription[]

export type StandardAttributeDescriptionsXML = { "xr:StandardAttribute": StandardAttributeDescriptionXML[] }

export type StandardAttributeDescriptionsYAML = Partial<Record<StandartAttributeYAML, StandardAttributeDescriptionYAML>>
