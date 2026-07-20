import { Type } from "typebox"
import { BooleanJSONSchema } from "../boolean/types"
import { registerTypeRule } from "../../orchestration"

registerTypeRule("UserSettingsID", "exportToJSONSchema", () => Type.Union([BooleanJSONSchema, Type.String()]))
