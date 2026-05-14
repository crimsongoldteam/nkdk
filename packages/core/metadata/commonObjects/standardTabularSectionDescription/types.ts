import { Type } from "@sinclair/typebox"
import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"

export type StandardTabularSectionDescription = Record<string, unknown>
export type StandardTabularSectionDescriptionYAML = Record<string, unknown>

export type StandardTabularSectionDescriptions = StandardTabularSectionDescription[]
export type StandardTabularSectionDescriptionsXML = {
  "xr:StandardTabularSection": Record<string, unknown> | Record<string, unknown>[]
}

export const StandardTabularSectionDescriptionsJSONSchema = Type.Record(Type.String(), Type.Any())
export type StandardTabularSectionDescriptionsYAML = Record<string, StandardTabularSectionDescriptionYAML>

export type StandardTabularSectionAttributeDescriptions = StandardAttributeDescriptions
export type StandardTabularSectionAttributeDescriptionsYAML = StandardAttributeDescriptionsYAML
