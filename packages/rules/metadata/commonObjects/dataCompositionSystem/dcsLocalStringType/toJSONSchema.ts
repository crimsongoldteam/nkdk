import { exportI8nTextToJSONSchema } from "../../i8nText/toJSONSchema"
import { definePropertyTypeRule } from "../../../ruleRuntime"

export const metadataPropertyRule000 = definePropertyTypeRule("DcsLocalStringType", "exportToJSONSchema", exportI8nTextToJSONSchema)
