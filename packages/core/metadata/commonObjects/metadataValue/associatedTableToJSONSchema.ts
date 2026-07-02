import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "../../orchestration"

export const exportAssociatedTableToJSONSchema = () => Type.String()

registerTypeRule("AssociatedTable", "exportToJSONSchema", exportAssociatedTableToJSONSchema)
