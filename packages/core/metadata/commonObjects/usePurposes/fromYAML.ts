import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { UsePurposes, UsePurposesYAML } from "./types"

export const importUsePurposesFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: UsePurposesYAML | undefined
): UsePurposes | undefined => {
  if (!data) return undefined

  if (data === "ПлатформаИМобильноеПриложение") {
    return ["PlatformApplication", "MobilePlatformApplication"]
  }

  if (data === "МобильноеПриложение") {
    return ["MobilePlatformApplication"]
  }

  return undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("UsePurposes", "importFromYAML", importUsePurposesFromYAML)
