import { exportI8nTextToYAML } from "../../i8nText/toYAML"
import { registerTypeRule } from "../../../orchestration"

registerTypeRule("DcsLocalStringType", "exportToYAML", exportI8nTextToYAML)
