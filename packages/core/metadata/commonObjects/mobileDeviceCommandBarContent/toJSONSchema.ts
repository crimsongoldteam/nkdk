import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { MobileDeviceCommandBarContentJSONSchema } from "./types"

export const exportMobileDeviceCommandBarContentToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MobileDeviceCommandBarContentJSONSchema
}

registerTypeRule("MobileDeviceCommandBarContent", "exportToJSONSchema", exportMobileDeviceCommandBarContentToJSONSchema)
