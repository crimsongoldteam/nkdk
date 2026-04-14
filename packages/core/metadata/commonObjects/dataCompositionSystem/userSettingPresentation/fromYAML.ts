import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("UserSettingPresentation", "importFromYAML", importI8nTextFromYAML)
