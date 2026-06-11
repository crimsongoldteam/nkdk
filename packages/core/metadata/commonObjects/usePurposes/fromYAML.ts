import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { UsePurposes, UsePurposesYAML } from "./types"

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
