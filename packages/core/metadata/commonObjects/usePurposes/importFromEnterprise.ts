import { ConfigurationContext } from "../../context/types"
import { UsePurposes, UsePurposesEnterprise } from "./types"

export const importUsePurposesFromEnterprise = (
  _context: ConfigurationContext,
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
