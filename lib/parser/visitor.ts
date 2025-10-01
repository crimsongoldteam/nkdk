import { CstChildrenDictionary } from "chevrotain"
import { Parser } from "./parser"
import inputFieldVisit from "~/lib/metadata/forms/elements/inputField/parseVisit"
import { TInputField } from "../metadata/forms/elements/inputField/types"
const BaseVisitor = new Parser().getBaseCstVisitorConstructor()

export class Visitor extends BaseVisitor {
  inputField(ctx: CstChildrenDictionary): TInputField {
    return inputFieldVisit(this, ctx)
  }
}
