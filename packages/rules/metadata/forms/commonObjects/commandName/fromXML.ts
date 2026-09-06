import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { importStringFromXML } from "../../../commonObjects/string/fromXML"

export const metadataPropertyRule000 = definePropertyTypeRule("CommandName", "importFromXML", importStringFromXML)
