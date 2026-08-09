import { Type } from "typebox"
import { registerTypeRule } from "../../ruleRuntime"

export const exportChildSubsystemNamesToJSONSchema = () => Type.Array(Type.String())

registerTypeRule("ChildSubsystemNames", "exportToJSONSchema", exportChildSubsystemNamesToJSONSchema)
