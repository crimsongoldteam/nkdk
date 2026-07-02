import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "../../../orchestration"

registerTypeRule("TableAdditionalSource", "exportToJSONSchema", () => Type.String())
