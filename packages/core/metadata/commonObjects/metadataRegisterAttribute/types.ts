import { Type } from "typebox"
import { MetadataNameYAML } from "../metadataName/types"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import {
  MetadataRegisterFieldFullYAML,
  MetadataRegisterFieldYAML,
  MetadataRegisterFieldXML,
} from "../metadataRegisterField/types"
import { MetadataRegisterAttributeRules } from "./rules"

export type MetadataRegisterAttribute = MetadataTypeByRule<typeof MetadataRegisterAttributeRules>

export interface MetadataRegisterAttributeXML extends MetadataRegisterFieldXML {
  Properties: MetadataRegisterFieldXML["Properties"] & {
    ScheduleLink?: string
  }
}

export interface MetadataRegisterAttributeFullYAML extends MetadataRegisterFieldFullYAML {
  СвязьСГрафиком?: string
}

export type MetadataRegisterAttributeYAML = MetadataRegisterAttributeFullYAML | MetadataRegisterFieldYAML

export type MetadataRegisterAttributes = MetadataRegisterAttribute[]
export type MetadataRegisterAttributesXML = MetadataRegisterAttributeXML | MetadataRegisterAttributeXML[]

export const MetadataRegisterAttributesJSONSchema = Type.Record(Type.String(), Type.Any())
export type MetadataRegisterAttributesYAML = Record<MetadataNameYAML, MetadataRegisterAttributeYAML>
