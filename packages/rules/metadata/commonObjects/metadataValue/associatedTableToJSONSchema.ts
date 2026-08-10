import { Type } from "typebox"
import { definePropertyTypeRule } from "../../ruleRuntime"

export const exportAssociatedTableToJSONSchema = () => Type.String()

export const metadataPropertyRule000 = definePropertyTypeRule("AssociatedTable", "exportToJSONSchema", exportAssociatedTableToJSONSchema)
