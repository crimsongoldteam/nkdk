import { exportI8nTextToJSONSchema } from "../../i8nText/toJSONSchema"
import { registerTypeRule } from "../../../ruleRuntime"

registerTypeRule("DcsLocalStringType", "exportToJSONSchema", exportI8nTextToJSONSchema)
