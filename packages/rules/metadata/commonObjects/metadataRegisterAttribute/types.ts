import { Type } from "typebox"
import { MetadataNameYAML } from "../metadataName/types"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import {
  MetadataRegisterFieldFullYAML,
  MetadataRegisterFieldYAML,
  MetadataRegisterFieldXML,
} from "../metadataRegisterField/types"
import {
  registerAttributeBinaryStorageUseFieldFragment,
  registerAttributeBinaryStorageUseFragment,
  registerAttributeChoiceFragment,
  registerAttributeDataHistoryFragment,
  registerAttributeFillFragment,
  registerAttributeIdentityFragment,
  registerAttributeIndexAndFullTextFragment,
  registerAttributePresentationFragment,
  registerAttributeScheduleLinkFragment,
  registerAttributeUuidFragment,
} from "./fragments"

type MetadataRegisterAttributeProperties =
  & typeof registerAttributeIdentityFragment.properties
  & typeof registerAttributePresentationFragment.properties
  & typeof registerAttributeFillFragment.properties
  & typeof registerAttributeChoiceFragment.properties
  & typeof registerAttributeIndexAndFullTextFragment.properties
  & typeof registerAttributeDataHistoryFragment.properties
  & typeof registerAttributeBinaryStorageUseFragment.properties
  & typeof registerAttributeBinaryStorageUseFieldFragment.properties
  & typeof registerAttributeScheduleLinkFragment.properties
  & typeof registerAttributeUuidFragment.properties

export type MetadataRegisterAttribute = MetadataTypeByRule<{
  itemType: "MetadataRegisterAttribute"
  properties: MetadataRegisterAttributeProperties
}>

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
