import { Type } from "typebox"
import { definePropertyTypeRule } from "../../ruleRuntime"

export const exportChildSubsystemNamesToJSONSchema = () => Type.Array(Type.String())

export const metadataPropertyRule000 = definePropertyTypeRule("ChildSubsystemNames", "exportToJSONSchema", exportChildSubsystemNamesToJSONSchema)
