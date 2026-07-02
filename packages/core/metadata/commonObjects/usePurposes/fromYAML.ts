import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
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

registerTypeRule("UsePurposes", "importFromYAML", importUsePurposesFromYAML)
