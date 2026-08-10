import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import type { UsePurposes, UsePurposesYAML } from "./types"

export const exportUsePurposesToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: UsePurposes | undefined
): UsePurposesYAML | undefined => {
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
  // так как в YAML формате нет отдельного значения для только PlatformApplication
  return undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("UsePurposes", "exportToYAML", exportUsePurposesToYAML)
