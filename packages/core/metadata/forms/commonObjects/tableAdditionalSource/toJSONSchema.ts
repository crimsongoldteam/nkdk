import { Type } from "typebox"
import { registerTypeRule } from "../../../ruleRuntime"

registerTypeRule("TableAdditionalSource", "exportToJSONSchema", () => Type.String())
