import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "../../orchestration"

registerTypeRule("MinMaxValue", "exportToJSONSchema", () => Type.Number())
