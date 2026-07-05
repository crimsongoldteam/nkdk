import { Type } from "typebox"
import { registerTypeRule } from "../../orchestration"

export const exportChildSubsystemNamesToJSONSchema = () => Type.Array(Type.String())

registerTypeRule("ChildSubsystemNames", "exportToJSONSchema", exportChildSubsystemNamesToJSONSchema)
