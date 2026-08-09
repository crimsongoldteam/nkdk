import { Type } from "typebox"
import { registerTypeRule } from "../../ruleRuntime"

export const exportAssociatedTableToJSONSchema = () => Type.String()

registerTypeRule("AssociatedTable", "exportToJSONSchema", exportAssociatedTableToJSONSchema)
