import { TSchema } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import { MobileDeviceCommandBarContentJSONSchema } from "./types"

export const exportMobileDeviceCommandBarContentToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MobileDeviceCommandBarContentJSONSchema
}

registerTypeRule("MobileDeviceCommandBarContent", "exportToJSONSchema", exportMobileDeviceCommandBarContentToJSONSchema)
