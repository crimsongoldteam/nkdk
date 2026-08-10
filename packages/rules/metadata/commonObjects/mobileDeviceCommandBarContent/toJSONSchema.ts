import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { MobileDeviceCommandBarContentJSONSchema } from "./types"

export const exportMobileDeviceCommandBarContentToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MobileDeviceCommandBarContentJSONSchema
}

export const metadataPropertyRule000 = definePropertyTypeRule("MobileDeviceCommandBarContent", "exportToJSONSchema", exportMobileDeviceCommandBarContentToJSONSchema)
