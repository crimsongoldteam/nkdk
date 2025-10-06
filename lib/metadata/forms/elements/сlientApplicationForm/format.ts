import { type TClientApplicationForm } from "./types"
import * as t from "~/lib/parser/lexer"
import { formatInputField } from "../inputField/format"
import { IFormatterParams } from "~/lib/formatter/types"

const DASHES = (t.Dashes.LABEL as string).repeat(3)

export function formatClientApplicationForm(element: TClientApplicationForm, _params: IFormatterParams): string[] {
  const result: string[] = []

  let header = element.title?.ru ?? ""

  if (header) {
    header = DASHES + " " + header + " " + DASHES
    result.push(header)
  }

  for (const item of element.items) {
    const itemFormatted = formatInputField(item, _params)
    result.push(...itemFormatted)
  }

  return result
}
