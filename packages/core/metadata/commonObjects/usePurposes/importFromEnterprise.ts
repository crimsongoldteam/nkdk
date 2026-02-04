import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { UsePurposes, UsePurposesEnterprise } from "./types"

export const importUsePurposesFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: UsePurposesEnterprise | undefined
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


registerTypeRule("UsePurposes", "importFromEnterprise", importUsePurposesFromEnterprise)