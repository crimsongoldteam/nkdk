import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { definePropertyTypeRule } from "../../../ruleRuntime"

export const metadataPropertyRule000 = definePropertyTypeRule("DcsLocalStringType", "importFromYAML", importI8nTextFromYAML)
