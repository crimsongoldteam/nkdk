import { MetadataAttributeFullYAML, MetadataAttributeXML } from "../metadataAttribute/types"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { MetadataNameYAML } from "../metadataName/types"
import { MetadataTaskAddressingAttributeRules } from "./rules"

export type MetadataTaskAddressingAttribute = MetadataTypeByRule<typeof MetadataTaskAddressingAttributeRules>

export interface MetadataTaskAddressingAttributeXML extends MetadataAttributeXML {
  Properties: MetadataAttributeXML["Properties"] & {
    AddressingDimension?: string
  }
}

export interface MetadataTaskAddressingAttributeYAML extends MetadataAttributeFullYAML {
  ИзмерениеАдресации?: string
}

export type MetadataTaskAddressingAttributes = MetadataTaskAddressingAttribute[]
export type MetadataTaskAddressingAttributesXML =
  | MetadataTaskAddressingAttributeXML
  | MetadataTaskAddressingAttributeXML[]
export type MetadataTaskAddressingAttributesYAML = Record<MetadataNameYAML, MetadataTaskAddressingAttributeYAML>
