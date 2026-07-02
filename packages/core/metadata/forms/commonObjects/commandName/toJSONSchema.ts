import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"

registerTypeRule("CommandName", "exportToJSONSchema", () => Type.String())
