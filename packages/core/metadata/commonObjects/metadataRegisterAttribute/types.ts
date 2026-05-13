import { Type } from "@sinclair/typebox"
import { MetadataNameYAML } from "~/metadata/commonObjects/metadataName/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { MetadataRegisterFieldYAML, MetadataRegisterFieldXML } from "../metadataRegisterField/types"
import { MetadataRegisterAttributeRules } from "./rules"

export type MetadataRegisterAttribute = MetadataTypeByRule<typeof MetadataRegisterAttributeRules>

export type MetadataRegisterAttributeXML = MetadataRegisterFieldXML
export type MetadataRegisterAttributeYAML = MetadataRegisterFieldYAML

export type MetadataRegisterAttributes = MetadataRegisterAttribute[]
export type MetadataRegisterAttributesXML = MetadataRegisterAttributeXML | MetadataRegisterAttributeXML[]

export const MetadataRegisterAttributesJSONSchema = Type.Record(Type.String(), Type.Any())
export type MetadataRegisterAttributesYAML = Record<MetadataNameYAML, MetadataRegisterAttributeYAML>
