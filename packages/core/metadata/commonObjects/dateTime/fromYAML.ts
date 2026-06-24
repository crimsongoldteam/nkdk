import { format, parse } from "date-fns"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { DateTimeYAML } from "./types"

const importDateOnlyFromYAML = (value: string): string => {
  try {
    const parsed = parse(value, "dd.MM.yyyy", new Date())
    if (isNaN(parsed.getTime())) return value
    return format(parsed, "yyyy-MM-dd'T'00:00:00")
  } catch {
    return value
  }
}

const importDateTimeFromYAMLValue = (value: string): string => {
  try {
    const parsed = parse(value, "dd.MM.yyyy HH:mm", new Date())
    if (isNaN(parsed.getTime())) return value
    return format(parsed, "yyyy-MM-dd'T'HH:mm:00")
  } catch {
    return value
  }
}

export const importDateTimeFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: DateTimeYAML | undefined
): string | undefined => {
  if (value === undefined) return undefined
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return importDateOnlyFromYAML(value)
  if (/^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}$/.test(value)) return importDateTimeFromYAMLValue(value)
  return value
}

registerTypeRule("dateTime", "importFromYAML", importDateTimeFromYAML)
