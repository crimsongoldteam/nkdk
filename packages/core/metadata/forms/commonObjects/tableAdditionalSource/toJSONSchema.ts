import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("TableAdditionalSource", "exportToJSONSchema", () => Type.String())
