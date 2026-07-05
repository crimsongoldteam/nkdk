import { Type } from "@sinclairtypebox"
import { registerTypeRule } from "../../../orchestration"

registerTypeRule("TableAdditionalSource", "exportToJSONSchema", () => Type.String())
