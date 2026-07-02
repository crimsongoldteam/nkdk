import { format } from "date-fns"
import { StandardBeginningDateVariantToYAML } from "../../systemEnumerations/types"
import type { StandartBeginningDate, StandartBeginningDateYAML } from "./types"

const formatISODateTimeToRussian = (value: string): string => {
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  return format(date, "dd.MM.yyyy HH:mm:ss")
}

export const exportStandartBeginningDateToYAML = (
  value: StandartBeginningDate | undefined
): StandartBeginningDateYAML | undefined => {
  if (!value) return undefined

  return {
    Вариант: StandardBeginningDateVariantToYAML[value.variant],
    ...(value.date !== undefined ? { Дата: formatISODateTimeToRussian(value.date) } : {}),
  }
}
