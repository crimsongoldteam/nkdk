import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { XDTOPackagesJSONSchema } from "./types"

export const exportXDTOPackagesToJSONSchema: ExportToJSONSchemaFn = (): TSchema => XDTOPackagesJSONSchema

registerTypeRule("XDTOPackages", "exportToJSONSchema", exportXDTOPackagesToJSONSchema)
