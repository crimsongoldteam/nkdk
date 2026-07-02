import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { registerTypeRule } from "../../../orchestration"

registerTypeRule("DcsLocalStringType", "importFromYAML", importI8nTextFromYAML)
