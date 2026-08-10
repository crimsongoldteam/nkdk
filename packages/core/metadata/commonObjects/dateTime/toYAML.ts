import { format } from "date-fns"
import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { DateTimeYAML } from "./types"

const hasZeroTime = (date: Date): boolean => {
  return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
}

export const exportDateTimeToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): DateTimeYAML | undefined => {
  if (value === undefined) return undefined
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  if (hasZeroTime(date)) return format(date, "dd.MM.yyyy")
  return format(date, "dd.MM.yyyy HH:mm")
}

export const metadataPropertyRule000 = definePropertyTypeRule("dateTime", "exportToYAML", exportDateTimeToYAML)
