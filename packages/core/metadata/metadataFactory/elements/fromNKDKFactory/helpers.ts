import { FormattedI8nText } from "~/metadata/commonObjects/formattedI8nText/types"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { ConfigurationContext } from "~/metadata/context/types"

export const importNameFromNKDK = (name: string | undefined): string => {
  if (name == null) return ""
  return name.startsWith("%") ? name.slice(1) : name
}

export const importI8nTextFromNKDK = (
  context: ConfigurationContext,
  value: string | undefined
): I8nText | undefined => {
  const unescapedValue = unescapeText(value)
  const result = importI8nTextFromString({ context, value: unescapedValue, trim: true })
  if (result === undefined) return undefined
  return result
}

export const importFormattedI8nTextFromNKDK = (
  context: ConfigurationContext,
  value: string | undefined
): FormattedI8nText | undefined => {
  const result = importI8nTextFromNKDK(context, value)
  if (result === undefined) return undefined
  return { formatted: false, items: result.items }
}

const ESC_RE = /\\(n|t|r|\\|"|'|u[0-9A-Fa-f]{4}|x[0-9A-Fa-f]{2})/g
const ESC: Record<string, string> = { n: "\n", t: "\t", r: "\r", "\\": "\\", '"': '"', "'": "'" }

const unescapeText = (content: string | undefined): string | undefined => {
  if (content === undefined) return undefined

  let s = content
  if (content.length >= 2) {
    const q = content[0]
    if ((q === '"' || q === "'") && content[content.length - 1] === q) s = content.slice(1, -1)
  }
  s = s.replace(/""|''/g, (m) => m[0])
  return s.replace(
    ESC_RE,
    (_, p1) =>
      ESC[p1] ??
      (p1[0] === "u"
        ? String.fromCharCode(parseInt(p1.slice(1), 16))
        : p1[0] === "x"
          ? String.fromCharCode(parseInt(p1.slice(1), 16))
          : "\\" + p1)
  )
}
