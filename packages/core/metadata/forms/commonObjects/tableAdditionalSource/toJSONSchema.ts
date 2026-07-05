import { Type } from "typebox"
import { registerTypeRule } from "../../../orchestration"

registerTypeRule("TableAdditionalSource", "exportToJSONSchema", () => Type.String())
