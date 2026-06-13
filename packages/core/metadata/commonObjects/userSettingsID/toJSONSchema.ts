import { BooleanJSONSchema } from "../boolean/types"
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("UserSettingsID", "exportToJSONSchema", () => BooleanJSONSchema)
