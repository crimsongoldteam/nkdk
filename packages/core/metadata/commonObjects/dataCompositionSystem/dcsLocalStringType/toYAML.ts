import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("DcsLocalStringType", "exportToYAML", exportI8nTextToYAML)
