import { ConfigurationContext } from "~/metadata/context/types"
import { formatDefaultLanguageText } from "~/metadata/forms/format/helpers"
import { I8nText } from "../i8nText/types"

// export function exportTitleToNKDK(params: {
//   context: ConfigurationContext
//   title: I8nText | undefined
// }): string | undefined {
//   const { context, title } = params

//   if (title !== undefined && isEmptyI8nText(context, title)) {
//     return "''"
//   }

//   let titleText = formatDefaultLanguageText(context, title)

//   return titleText
// }

export function exportTitleToNKDK(params: {
  context: ConfigurationContext
  title: I8nText | undefined
}): string | undefined {
  const { context, title } = params

  const titleText = formatDefaultLanguageText(context, title)

  return titleText
}
