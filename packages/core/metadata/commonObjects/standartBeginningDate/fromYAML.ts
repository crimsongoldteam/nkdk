import { format, parse } from "date-fns"
import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../orchestration/property/types"
import { importSystemEnumerationFromYAML } from "../../systemEnumerations/fromYAML"
import type { StandardBeginningDateVariant } from "../../systemEnumerations/types"
import type { StandartBeginningDate, StandartBeginningDateYAML } from "./types"

const parseRussianDateTimeToISO = (value: string): string => {
  try {
    const parsed = parse(value, "dd.MM.yyyy HH:mm:ss", new Date())
    if (isNaN(parsed.getTime())) return value
    return format(parsed, "yyyy-MM-dd'T'HH:mm:ss")
  } catch {
    return value
  }
}

export const importStandartBeginningDateFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: StandartBeginningDateYAML | undefined
): StandartBeginningDate | undefined => {
  if (!yaml) return undefined

  const variant = importSystemEnumerationFromYAML<StandardBeginningDateVariant>({
    context,
    rule: { type: "SystemEnumeration", typeSE: "StandardBeginningDateVariant" },
    value: yaml.Вариант,
  })
  if (!variant) return undefined

  return {
    variant,
    ...(yaml.Дата !== undefined ? { date: parseRussianDateTimeToISO(yaml.Дата) } : {}),
  }
}
