import { exportI8nTextToYAML } from "../../i8nText/toYAML"
import { registerTypeRule } from "../../../ruleRuntime"

registerTypeRule("DcsLocalStringType", "exportToYAML", exportI8nTextToYAML)
