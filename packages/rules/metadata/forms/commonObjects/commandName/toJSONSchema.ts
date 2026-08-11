import { Type } from "typebox"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"

export const metadataPropertyRule000 = definePropertyTypeRule("CommandName", "exportToJSONSchema", () => Type.String())
