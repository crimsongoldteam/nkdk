import { Type } from "@sinclairtypebox"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"

registerTypeRule("CommandName", "exportToJSONSchema", () => Type.String())
