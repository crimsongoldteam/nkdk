import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("DcsLocalStringType", "importFromYAML", importI8nTextFromYAML)
