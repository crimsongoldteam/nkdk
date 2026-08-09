import { TSchema } from "typebox"
import { ExportToJSONSchemaFn } from "../../ruleRuntime"
import { registerTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { XDTOPackagesJSONSchema } from "./types"

export const exportXDTOPackagesToJSONSchema: ExportToJSONSchemaFn = (): TSchema => XDTOPackagesJSONSchema

registerTypeRule("XDTOPackages", "exportToJSONSchema", exportXDTOPackagesToJSONSchema)
