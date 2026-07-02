import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "../../orchestration"

export const exportMetadataCommandGroupToJSONSchema = () => Type.String()

registerTypeRule("MetadataCommandGroup", "exportToJSONSchema", exportMetadataCommandGroupToJSONSchema)
