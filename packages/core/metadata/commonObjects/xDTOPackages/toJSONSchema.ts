import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { XDTOPackagesJSONSchema } from "./types"

export const exportXDTOPackagesToJSONSchema: ExportToJSONSchemaFn = (): TSchema => XDTOPackagesJSONSchema

registerTypeRule("XDTOPackages", "exportToJSONSchema", exportXDTOPackagesToJSONSchema)
