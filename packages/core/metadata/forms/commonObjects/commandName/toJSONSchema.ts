import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"

registerTypeRule("CommandName", "exportToJSONSchema", () => Type.String())
