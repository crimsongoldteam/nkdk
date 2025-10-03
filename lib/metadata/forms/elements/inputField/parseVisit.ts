import { CstChildrenDictionary } from "../../../../chevrotian"
import { TInputField, ZInputField } from "./types"
import { Visitor } from "~/lib/parser/visitor"
import { joinTokens } from "~/lib/parser/visitorUtils"

export default function inputFieldVisit(_visitor: Visitor, ctx: CstChildrenDictionary): TInputField {
  const result: TInputField = {}

  const header = joinTokens(ctx.InputHeader)
  if (header) {
    result.title = { ru: header }
  }

  const content = joinTokens(ctx.InputValue)
  if (content) {
    result.value = content
  }

  return ZInputField.parse(result)
}
