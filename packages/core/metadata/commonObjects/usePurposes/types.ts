import { MetadataSimpleValueXML } from "../metadataValue/types"

export type UsePurposes = ("PlatformApplication" | "MobilePlatformApplication")[]

export interface UsePurposesXML {
  "v8:Value": MetadataSimpleValueXML | MetadataSimpleValueXML[]
}

export type UsePurposesEnterprise = "МобильноеПриложение" | "ПлатформаИМобильноеПриложение"
