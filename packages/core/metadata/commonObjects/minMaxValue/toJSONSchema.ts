import { Type } from "@sinclairtypebox"
import { registerTypeRule } from "../../orchestration"

registerTypeRule("MinMaxValue", "exportToJSONSchema", () => Type.Number())
