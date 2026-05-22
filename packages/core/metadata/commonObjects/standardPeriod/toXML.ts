import { StandardPeriod, StandardPeriodXML } from "./types"

export const exportStandardPeriodToXML = (data: StandardPeriod | undefined): StandardPeriodXML | undefined => {
  if (data === undefined) return undefined

  const result: StandardPeriodXML = {
    "_xsi:type": "v8:StandardPeriod",
    "v8:variant": {
      "_xsi:type": "v8:StandardPeriodVariant",
      "#text": data.variant,
    },
  }

  if (data.startDate !== undefined) {
    result["v8:startDate"] = data.startDate
  }

  if (data.endDate !== undefined) {
    result["v8:endDate"] = data.endDate
  }

  return result
}
