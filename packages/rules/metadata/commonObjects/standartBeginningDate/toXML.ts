import type { StandartBeginningDate, StandartBeginningDateXML } from "./types"

export const exportStandartBeginningDateToXML = (
  value: StandartBeginningDate | undefined
): StandartBeginningDateXML | undefined => {
  if (!value) return undefined

  return {
    "_xsi:type": "v8:StandardBeginningDate",
    "v8:variant": {
      "_xsi:type": "v8:StandardBeginningDateVariant",
      "#text": value.variant,
    },
    ...(value.date !== undefined ? { "v8:date": value.date } : {}),
  }
}
