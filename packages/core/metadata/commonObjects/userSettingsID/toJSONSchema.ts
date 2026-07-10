import { BooleanJSONSchema } from "../boolean/types"
import { registerTypeRule } from "../../orchestration"

registerTypeRule("UserSettingsID", "exportToJSONSchema", () => BooleanJSONSchema)
