import { Type } from "typebox"
import { registerTypeRule } from "../../orchestration"

export const exportMetadataCommandGroupToJSONSchema = () => Type.String()

registerTypeRule("MetadataCommandGroup", "exportToJSONSchema", exportMetadataCommandGroupToJSONSchema)
