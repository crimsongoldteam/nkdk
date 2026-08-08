import { registerDependentYamlItemHandler } from "../../orchestration/property/dependentItemRegistry"
import { analyzeMetadataAttributeFillValue, analyzeStandardAttributeFillValue } from "./analyzeItem"

let registered = false

export function registerFillValueValidation(): void {
  if (registered) return
  registered = true
  registerDependentYamlItemHandler("MetadataAttribute", analyzeMetadataAttributeFillValue)
  registerDependentYamlItemHandler("StandardAttributeDescription", analyzeStandardAttributeFillValue)
}
