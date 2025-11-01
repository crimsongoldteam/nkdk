// import { CstChildrenDictionary, CstNode } from "chevrotain"
// import { Parser } from "./parser"
// import inputFieldVisit from "~/lib/metadata/forms/elements/inputField/parseVisit"
// import { TInputField } from "~/lib/metadata/forms/elements/inputField/types"
// import { TClientApplicationForm } from "~/lib/metadata/forms/elements/clientApplicationForm/types"
// import clientApplicationFormVisit, {
//   clientApplicationFormHeaderVisit,
//   IClientApplicationFormHeaderVisit,
// } from "~/lib/metadata/forms/elements/clientApplicationForm/parseVisit"

// const BaseVisitor: new () => any = new Parser().getBaseCstVisitorConstructor()

// export class Visitor extends BaseVisitor {
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
