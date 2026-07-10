import { Type } from "typebox"
import type { I8nTextXML } from "../i8nText/types"
import type {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionsYAML,
} from "../standardAttributeDescription/types"
import type { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import type { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import type * as SE from "../../systemEnumerations/types"
import type { StandardTabularSectionDescriptionRules } from "./rules"

export type StandardTabularSectionDescription = MetadataTypeByRule<typeof StandardTabularSectionDescriptionRules>
export type StandardTabularSectionDescriptionYAML = YAMLTypeByRule<typeof StandardTabularSectionDescriptionRules>

export type StandardTabularSectionDescriptions = StandardTabularSectionDescription[]
export interface StandardTabularSectionDescriptionXML {
  _name: string
  "xr:Synonym"?: I8nTextXML
  "xr:Comment"?: string
  "xr:ToolTip"?: I8nTextXML
  "xr:FillChecking"?: SE.FillChecking
  "xr:StandardAttributes"?: StandardAttributeDescriptionsXML
}
export type StandardTabularSectionDescriptionsXML = {
  "xr:StandardTabularSection": StandardTabularSectionDescriptionXML | StandardTabularSectionDescriptionXML[]
}

export const StandardTabularSectionDescriptionsJSONSchema = Type.Record(Type.String(), Type.Any())
export type StandardTabularSectionDescriptionsYAML = Record<string, StandardTabularSectionDescriptionYAML>

export type StandardTabularSectionAttributeDescriptions = StandardAttributeDescriptions
export type StandardTabularSectionAttributeDescriptionsYAML = StandardAttributeDescriptionsYAML
