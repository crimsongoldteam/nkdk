import { Type } from "typebox"
import { registerTypeRule } from "../../ruleRuntime"

export const exportMetadataCommandGroupToJSONSchema = () => Type.String()

registerTypeRule("MetadataCommandGroup", "exportToJSONSchema", exportMetadataCommandGroupToJSONSchema)
