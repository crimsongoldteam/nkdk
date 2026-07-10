import { Type } from "typebox"
import { registerTypeRule } from "../../orchestration"

registerTypeRule("MinMaxValue", "exportToJSONSchema", () => Type.Number())
