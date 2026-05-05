import { Static, Type } from "@sinclair/typebox"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"

export type UsePurposes = ("PlatformApplication" | "MobilePlatformApplication")[]

export interface UsePurposesXML {
  "v8:Value": MetadataPrimitiveValueXML | MetadataPrimitiveValueXML[]
}

export const UsePurposesJSONSchema = Type.Union([
  Type.Literal("МобильноеПриложение"),
  Type.Literal("ПлатформаИМобильноеПриложение"),
])

export type UsePurposesYAML = Static<typeof UsePurposesJSONSchema>
