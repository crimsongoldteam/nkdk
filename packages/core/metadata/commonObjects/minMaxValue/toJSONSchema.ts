import { Type } from "typebox"
import { registerTypeRule } from "../../ruleRuntime"

registerTypeRule("MinMaxValue", "exportToJSONSchema", () => Type.Number())
