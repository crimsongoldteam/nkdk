import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import { importStringFromXML } from "../string/fromXML"

export const metadataPropertyRule000 = definePropertyTypeRule("DataPath", "importFromXML", importStringFromXML)
