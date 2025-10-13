import { type TClientApplicationForm } from "./types"
import * as t from "~/lib/parser/lexer"
import { IFormatterParams } from "~/lib/format/types"
import formatFormAttributes from "./attributes/format"
import { formatElement } from "~/lib/format/formatFactory"

const DASHES = (t.Dashes.LABEL as string).repeat(3)

export function formatClientApplicationForm(element: TClientApplicationForm, _params: IFormatterParams): string[] {
  const result: string[] = []

  let header = element.title?.ru ?? ""

  result.push(...formatSectionHeader(header))

  for (const item of element.items) {
    const itemFormatted = formatElement(item, _params)
    result.push(...itemFormatted)
  }

  if (element.attributes) {
    result.push(...formatSectionHeader("Реквизиты"))
    result.push(...formatFormAttributes(element.attributes))
  }
  return result
}

const formatSectionHeader = (header: string | undefined): string[] => {
  if (!header) return []

  return [DASHES + " " + header + " " + DASHES]
}
