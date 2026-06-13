import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"

export const exportAssociatedTableToJSONSchema = () => Type.String()

registerTypeRule("AssociatedTable", "exportToJSONSchema", exportAssociatedTableToJSONSchema)
