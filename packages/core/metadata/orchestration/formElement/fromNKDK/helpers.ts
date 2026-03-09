import { FormattedI8nText } from "~/metadata/commonObjects/formattedI8nText/types"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { ConfigurationContext } from "~/metadata/context/types"

export function importNameFromNKDK(source: { elementName: string; dataPath?: never }): string
export function importNameFromNKDK(source: { elementName?: string; dataPath: string[] }): string
export function importNameFromNKDK(source: { elementName?: string; dataPath?: string[] }): string {
  if (source.elementName !== undefined) return source.elementName

  if (source.dataPath === undefined) throw new Error("Data path is required")
  return source.dataPath.join("")
}

export const importDataPathFromNKDK = (source: { dataPath: string[] }): string => {
  return source.dataPath.join(".")
}

export function importI8nTextFromNKDK(context: ConfigurationContext, value: undefined): undefined
export function importI8nTextFromNKDK(context: ConfigurationContext, value: string): I8nText
export function importI8nTextFromNKDK(context: ConfigurationContext, value: string | undefined): I8nText | undefined
export function importI8nTextFromNKDK(context: ConfigurationContext, value: string | undefined): I8nText | undefined {
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

  let s = content.replace(
    ESC_RE,
    (_, p1) =>
      ESC[p1] ??
      (p1[0] === "u"
        ? String.fromCharCode(parseInt(p1.slice(1), 16))
        : p1[0] === "x"
          ? String.fromCharCode(parseInt(p1.slice(1), 16))
          : "\\" + p1)
  )
  if (s.length >= 2) {
    const q = s[0]
    if ((q === '"' || q === "'") && s[s.length - 1] === q) s = s.slice(1, -1)
  }
  return s.replace(/""|''/g, (m) => m[0])
}
