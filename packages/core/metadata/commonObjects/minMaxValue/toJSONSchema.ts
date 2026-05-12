import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("MinMaxValue", "exportToJSONSchema", () => Type.Number())
