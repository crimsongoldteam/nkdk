import { TSchema } from "typebox"
import { ExportToJSONSchemaFn } from "../../ruleRuntime"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { XDTOPackagesJSONSchema } from "./types"

export const exportXDTOPackagesToJSONSchema: ExportToJSONSchemaFn = (): TSchema => XDTOPackagesJSONSchema

export const metadataPropertyRule000 = definePropertyTypeRule("XDTOPackages", "exportToJSONSchema", exportXDTOPackagesToJSONSchema)
