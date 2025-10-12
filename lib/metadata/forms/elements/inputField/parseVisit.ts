import { CstChildrenDictionary } from "chevrotain"
import { TInputField, ZInputField } from "./types"
import { Visitor } from "~/lib/parser/visitor"
import { joinTokens } from "~/lib/parser/visitorUtils"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"

export default function inputFieldVisit(_visitor: Visitor, ctx: CstChildrenDictionary): TInputField {
  const result: TInputField = {
    name: "ПолеВвода",
    id: "1",
    type: ElementType.InputField,
  }

  const header = joinTokens(ctx.InputHeader as { image: string }[])
  if (header) {
    result.title = { ru: header }
  }

  const name = joinTokens(ctx.properties as { image: string }[])
  if (name) {
    result.name = name
  } else if (header) {
    result.name = header
  }

  const content = joinTokens(ctx.InputValue as { image: string }[])
  if (content) {
    result.value = content
  }

  return ZInputField.parse(result)
}
