import { Type } from "@sinclairtypebox"
import { registerTypeRule } from "../../orchestration"

export const exportMetadataCommandGroupToJSONSchema = () => Type.String()

registerTypeRule("MetadataCommandGroup", "exportToJSONSchema", exportMetadataCommandGroupToJSONSchema)
