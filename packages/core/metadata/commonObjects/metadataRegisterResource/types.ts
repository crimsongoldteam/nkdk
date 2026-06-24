import { Type } from "@sinclair/typebox"
import { StringboolXML, StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { MetadataNameYAML } from "~/metadata/commonObjects/metadataName/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { MetadataRegisterFieldFullYAML, MetadataRegisterFieldYAML, MetadataRegisterFieldXML } from "../metadataRegisterField/types"
import { MetadataRegisterResourceRules } from "./rules"

export type MetadataRegisterResource = MetadataTypeByRule<typeof MetadataRegisterResourceRules>

export interface MetadataRegisterResourceXML extends MetadataRegisterFieldXML {
  Properties: MetadataRegisterFieldXML["Properties"] & {
    AccountingFlag?: string
    Balance?: StringboolXML
    ExtDimensionAccountingFlag?: string
  }
}

export interface MetadataRegisterResourceFullYAML extends MetadataRegisterFieldFullYAML {
  Балансовый?: StringboolYAML
  ПризнакУчета?: string
  ПризнакУчетаСубконто?: string
}

export type MetadataRegisterResourceYAML = MetadataRegisterResourceFullYAML | MetadataRegisterFieldYAML

export type MetadataRegisterResources = MetadataRegisterResource[]
export type MetadataRegisterResourcesXML = MetadataRegisterResourceXML | MetadataRegisterResourceXML[]

export const MetadataRegisterResourcesJSONSchema = Type.Record(Type.String(), Type.Any())
export type MetadataRegisterResourcesYAML = Record<MetadataNameYAML, MetadataRegisterResourceYAML>
