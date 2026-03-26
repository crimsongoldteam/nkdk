import type { StandartBeginningDate, StandartBeginningDateXML } from "./types"

export const importStandartBeginningDateFromXML = (
  xml: StandartBeginningDateXML | undefined
): StandartBeginningDate | undefined => {
  if (!xml) return undefined

  const variant = xml["v8:variant"]?.["#text"]
  if (!variant) return undefined

  return {
    variant,
    ...(xml["v8:date"] !== undefined ? { date: xml["v8:date"] } : {}),
  }
}
