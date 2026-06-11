import { format, parse } from "date-fns"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { StandardPeriodVariant, StandardPeriodVariantFromYAML } from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { StandardPeriod, StandardPeriodYAML } from "./types"

export const isStandardPeriodYAML = (data: unknown): data is StandardPeriodYAML =>
  typeof data === "object" &&
  data !== null &&
  !Array.isArray(data) &&
  "Вариант" in data &&
  typeof data.Вариант === "string" &&
  data.Вариант in StandardPeriodVariantFromYAML

const parseDateTime = (dateTime: string | undefined): string | undefined => {
  if (dateTime === undefined) return undefined

  try {
    const date = parse(dateTime, "dd.MM.yyyy HH:mm:ss", new Date())
    if (!isNaN(date.getTime())) return format(date, "yyyy-MM-dd'T'HH:mm:ss")
    return dateTime
  } catch {
    return dateTime
  }
}

export const importStandardPeriodFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: StandardPeriodYAML | undefined
): StandardPeriod | undefined => {
  if (data === undefined) return undefined
  if (!isStandardPeriodYAML(data)) return undefined

  const variant = (StandardPeriodVariantFromYAML as Record<string, StandardPeriodVariant>)[data.Вариант]
  if (variant === undefined) return undefined

  const result: StandardPeriod = { variant }
  const startDate = parseDateTime(data.ДатаНачала)
  const endDate = parseDateTime(data.ДатаОкончания)

  if (startDate !== undefined) result.startDate = startDate
  if (endDate !== undefined) result.endDate = endDate

  return result
}
