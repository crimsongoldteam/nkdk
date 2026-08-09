import { Type } from "typebox"
import { registerTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"

registerTypeRule("CommandName", "exportToJSONSchema", () => Type.String())
