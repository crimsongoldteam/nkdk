import { Type } from "@sinclairtypebox"
import { registerTypeRule } from "../../orchestration"

export const exportAssociatedTableToJSONSchema = () => Type.String()

registerTypeRule("AssociatedTable", "exportToJSONSchema", exportAssociatedTableToJSONSchema)
