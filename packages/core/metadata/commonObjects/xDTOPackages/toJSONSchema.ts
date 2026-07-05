import { TSchema } from "@sinclairtypebox"
import { ExportToJSONSchemaFn } from "../../orchestration"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { XDTOPackagesJSONSchema } from "./types"

export const exportXDTOPackagesToJSONSchema: ExportToJSONSchemaFn = (): TSchema => XDTOPackagesJSONSchema

registerTypeRule("XDTOPackages", "exportToJSONSchema", exportXDTOPackagesToJSONSchema)
