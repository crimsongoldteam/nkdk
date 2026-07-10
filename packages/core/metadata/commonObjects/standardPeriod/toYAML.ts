import { format, parse } from "date-fns"
import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../orchestration/property/types"
import { StandardPeriodVariantToYAML } from "../../systemEnumerations/types"
import type { StandardPeriod, StandardPeriodYAML } from "./types"

const formatDateTime = (dateTime: string | undefined): string | undefined => {
  if (dateTime === undefined) return undefined

  try {
    const date = parse(dateTime, "yyyy-MM-dd'T'HH:mm:ss", new Date())
    if (!isNaN(date.getTime())) return format(date, "dd.MM.yyyy HH:mm:ss")
    return dateTime
  } catch {
    return dateTime
  }
}

export const exportStandardPeriodToYAML = (
  data: StandardPeriod | undefined,
  _context?: ConfigurationContext,
  _rule?: PropertyRule | undefined
): StandardPeriodYAML | undefined => {
  if (data === undefined) return undefined

  const result: StandardPeriodYAML = {
    Вариант: StandardPeriodVariantToYAML[data.variant],
  }
  const startDate = formatDateTime(data.startDate)
  const endDate = formatDateTime(data.endDate)

  if (startDate !== undefined) result.ДатаНачала = startDate
  if (endDate !== undefined) result.ДатаОкончания = endDate

  return result
}
