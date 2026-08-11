import { StandardPeriod, StandardPeriodXML } from "./types"

const getText = (value: { "#text"?: string } | string | undefined): string | undefined => {
  if (typeof value === "string") return value
  return value?.["#text"]
}

export const importStandardPeriodFromXML = (data: StandardPeriodXML | undefined): StandardPeriod | undefined => {
  if (data === undefined) return undefined

  const variant = getText(data["v8:variant"])
  if (variant === undefined) return undefined

  const result: StandardPeriod = { variant: variant as StandardPeriod["variant"] }
  const startDate = getText(data["v8:startDate"])
  const endDate = getText(data["v8:endDate"])

  if (startDate !== undefined) result.startDate = startDate
  if (endDate !== undefined) result.endDate = endDate

  return result
}
