import { exportI8nTextToJSONSchema } from "../../i8nText/toJSONSchema"
import { registerTypeRule } from "../../../orchestration"

registerTypeRule("DcsLocalStringType", "exportToJSONSchema", exportI8nTextToJSONSchema)
