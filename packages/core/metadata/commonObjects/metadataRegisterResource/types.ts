import { Type } from "@sinclair/typebox"
import { MetadataNameYAML } from "~/metadata/commonObjects/metadataName/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { MetadataRegisterFieldYAML, MetadataRegisterFieldXML } from "../metadataRegisterField/types"
import { MetadataRegisterResourceRules } from "./rules"

export type MetadataRegisterResource = MetadataTypeByRule<typeof MetadataRegisterResourceRules>

export type MetadataRegisterResourceXML = MetadataRegisterFieldXML
export type MetadataRegisterResourceYAML = MetadataRegisterFieldYAML

export type MetadataRegisterResources = MetadataRegisterResource[]
export type MetadataRegisterResourcesXML = MetadataRegisterResourceXML | MetadataRegisterResourceXML[]

export const MetadataRegisterResourcesJSONSchema = Type.Record(Type.String(), Type.Any())
export type MetadataRegisterResourcesYAML = Record<MetadataNameYAML, MetadataRegisterResourceYAML>
