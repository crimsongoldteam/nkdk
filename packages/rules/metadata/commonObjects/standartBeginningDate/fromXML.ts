import { claimCanonicalXmlImportAttribute } from "@nkdk/runtime"
import type { StandartBeginningDate, StandartBeginningDateXML } from "./types"

export const importStandartBeginningDateFromXML = (
  xml: StandartBeginningDateXML | undefined
): StandartBeginningDate | undefined => {
  if (!xml) return undefined

  const variantXml = xml["v8:variant"]
  claimCanonicalXmlImportAttribute({
    value: variantXml,
    name: "xsi:type",
    expectedValue: "v8:StandardBeginningDateVariant",
  })
  const variant = variantXml?.["#text"]
  if (!variant) return undefined

  return {
    variant,
    ...(xml["v8:date"] !== undefined ? { date: xml["v8:date"] } : {}),
  }
}
