// import { CstChildrenDictionary, CstNode } from "chevrotain"
// import { Parser } from "./parser"
// import inputFieldVisit from "~/lib/metadata/forms/elements/inputField/parseVisit"
// import { TInputField } from "~/lib/metadata/forms/elements/inputField/types"
// import { TClientApplicationForm } from "~/lib/metadata/forms/elements/clientApplicationForm/types"
// import clientApplicationFormVisit, {
//   clientApplicationFormHeaderVisit,
//   IClientApplicationFormHeaderVisit,
// } from "~/lib/metadata/forms/elements/clientApplicationForm/parseVisit"

import { CstChildrenDictionary, CstNode, IToken } from "chevrotain"
import { TLabelDecoration } from "~/lib/metadata/forms/elements/labelDecoration/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { joinTokens } from "../visitorUtils"
import { Parser } from "./parser"

const BaseVisitor: new () => any = new Parser().getBaseCstVisitorConstructor()

export class Visitor extends BaseVisitor {
  constructor() {
    super()
  }

  public visit(ast: CstNode): any {
    return super.visit(ast)
  }

  labelDecoration(ctx: CstChildrenDictionary): TLabelDecoration {
    const name = joinTokens(ctx.LabelContent as IToken[])

    return {
      elementType: ZElementType.enum.LabelDecoration,
      name: name || "",
      id: undefined,
    } as TLabelDecoration
  }
}

export const visitor = new Visitor()
//   // #region form

//   form(ctx: CstChildrenDictionary): TClientApplicationForm {
//     return clientApplicationFormVisit(this, ctx)
//   }

//   formHeader(ctx: CstChildrenDictionary): IClientApplicationFormHeaderVisit {
//     return clientApplicationFormHeaderVisit(this, ctx)
//   }

//   // #endregion

//   // #region field

//   field(ctx: CstChildrenDictionary): any {
//     const firstKey = Object.keys(ctx)[0]
//     const firstValue = ctx[firstKey as keyof typeof ctx]
//     return this.visit(firstValue as CstNode[])
//   }

//   // #endregion

//   inputField(ctx: CstChildrenDictionary): TInputField {
//     return inputFieldVisit(this, ctx)
//   }
// }
