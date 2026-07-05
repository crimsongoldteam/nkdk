import { Type } from "typebox"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"

registerTypeRule("CommandName", "exportToJSONSchema", () => Type.String())
