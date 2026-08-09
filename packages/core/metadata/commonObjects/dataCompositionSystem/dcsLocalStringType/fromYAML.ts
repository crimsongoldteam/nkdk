import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { registerTypeRule } from "../../../ruleRuntime"

registerTypeRule("DcsLocalStringType", "importFromYAML", importI8nTextFromYAML)
