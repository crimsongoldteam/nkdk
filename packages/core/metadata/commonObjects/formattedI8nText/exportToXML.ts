import { ConfigurationContext } from "~/metadata/context/types"
import { exportI8nTextToXML } from "../i8nText/exportToXML"
import { FormattedI8nText, FormattedI8nTextXML } from "./types"

// export const exportFormattedI8nTextToXMLWithDefaultLanguage = (
//   context: ConfigurationContext,
//   data: I8nText | undefined
// ): I8nTextXML | undefined => {
//   if (!data) return undefined

//   if (isEmptyI8nText(context, data)) {
//     return undefined
//   }

//   return exportI8nTextToXML(context, data)
// }

export const exportFormattedI8nTextToXML = (
  context: ConfigurationContext,
  data: FormattedI8nText | undefined
): FormattedI8nTextXML | undefined => {
  if (!data) return undefined

  const v8Items = exportI8nTextToXML(context, data)

  return { _formatted: data.formatted, ...v8Items }
}
