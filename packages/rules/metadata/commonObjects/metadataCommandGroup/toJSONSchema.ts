import { Type } from "typebox"
import { definePropertyTypeRule } from "../../ruleRuntime"

export const exportMetadataCommandGroupToJSONSchema = () => Type.String()

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataCommandGroup", "exportToJSONSchema", exportMetadataCommandGroupToJSONSchema)
