import { exportI8nTextToYAML } from "../../i8nText/toYAML"
import { definePropertyTypeRule } from "../../../ruleRuntime"

export const metadataPropertyRule000 = definePropertyTypeRule("DcsLocalStringType", "exportToYAML", exportI8nTextToYAML)
