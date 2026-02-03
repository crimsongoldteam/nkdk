import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { UsePurposes, UsePurposesEnterprise } from "./types"

export const exportUsePurposesToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: UsePurposes | undefined
): UsePurposesEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const hasPlatform = data.includes("PlatformApplication")
  const hasMobile = data.includes("MobilePlatformApplication")

  if (hasPlatform && hasMobile) {
    return "ПлатформаИМобильноеПриложение"
  }

  if (hasMobile) {
    return "МобильноеПриложение"
  }

  // Если только PlatformApplication, возвращаем undefined
  // так как в Enterprise формате нет отдельного значения для только PlatformApplication
  return undefined
}
