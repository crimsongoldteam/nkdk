import { CstChildrenDictionary } from "chevrotain"
import { TInputField, ZInputField } from "./types"
import { Visitor } from "~/lib/parser/visitor"
import { joinTokens } from "~/lib/parser/visitorUtils"

export default function inputFieldVisit(_visitor: Visitor, ctx: CstChildrenDictionary): TInputField {
  const result: TInputField = {
    name: "ПолеВвода",
  }

  const header = joinTokens(ctx.InputHeader)
  if (header) {
    result.title = { ru: header }
  }

  const name = joinTokens(ctx.properties)
  if (name) {
    result.name = name
  } else if (header) {
    result.name = header
  }

  const content = joinTokens(ctx.InputValue)
  if (content) {
    result.value = content
  }

  return ZInputField.parse(result)
}
