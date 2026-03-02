import { Static, Type } from "@sinclair/typebox"
import { MetadataSimpleValueXML } from "../metadataValue/types"

export type UsePurposes = ("PlatformApplication" | "MobilePlatformApplication")[]

export interface UsePurposesXML {
  "v8:Value": MetadataSimpleValueXML | MetadataSimpleValueXML[]
}

export const UsePurposesJSONSchema = Type.Union([
  Type.Literal("МобильноеПриложение"),
  Type.Literal("ПлатформаИМобильноеПриложение"),
])

export type UsePurposesYAML = Static<typeof UsePurposesJSONSchema>
