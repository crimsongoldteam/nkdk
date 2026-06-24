import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"

export const exportChildSubsystemNamesToJSONSchema = () => Type.Array(Type.String())

registerTypeRule("ChildSubsystemNames", "exportToJSONSchema", exportChildSubsystemNamesToJSONSchema)
