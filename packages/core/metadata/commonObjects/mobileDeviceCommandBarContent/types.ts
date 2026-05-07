import { Type } from "@sinclair/typebox"
import { MetadataTypedValue, MetadataValueJSONSchema, MetadataValueXML, MetadataValueYAML } from "../metadataValue/types"

export type MobileDeviceCommandBarContent = MetadataTypedValue[]

export interface MobileDeviceCommandBarContentItemXML {
  "xr:Presentation"?: ""
  "xr:CheckState": 0
  "xr:Value": MetadataValueXML
}

export interface MobileDeviceCommandBarContentXML {
  "xr:Item"?: MobileDeviceCommandBarContentItemXML | MobileDeviceCommandBarContentItemXML[]
}

export const MobileDeviceCommandBarContentJSONSchema = Type.Array(MetadataValueJSONSchema)
export type MobileDeviceCommandBarContentYAML = MetadataValueYAML[]
