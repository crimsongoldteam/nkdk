import { exportI8nTextToJSONSchema } from "~/metadata/commonObjects/i8nText/toJSONSchema"
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("DcsLocalStringType", "exportToJSONSchema", exportI8nTextToJSONSchema)
