// import { CstChildrenDictionary, CstElement, CstNode } from "chevrotain"
// import { Visitor } from "~/lib/parser/visitor"
// import { TClientApplicationForm } from "./types"
// import { joinTokens, visitAll } from "~/lib/parser/visitorUtils"
// import { ElementType } from "~/lib/metadata/systemEnumerations/types"

// export interface IСlientApplicationFormHeaderVisit {
//   title: string | undefined
// }

// export default function сlientApplicationFormVisit(
//   visitor: Visitor,
//   ctx: CstChildrenDictionary
// ): TClientApplicationForm {
//   const result: TClientApplicationForm = {
//     type: ElementType.Form,
//     items: [],
//   }

//   const header = visitor.visit(ctx.formHeader as CstNode[])

//   if (header?.title) {
//     result.title = { ru: header.title }
//   }

//   const items = visitAll(visitor, ctx.Items as CstNode[])
//   result.items.push(...items)

//   return result
// }

// export function сlientApplicationFormHeaderVisit(
//   _visitor: Visitor,
//   ctx: CstChildrenDictionary
// ): IСlientApplicationFormHeaderVisit {
//   return {
//     title: joinTokens(ctx.HeaderText as CstElement[]),
//   }
// }

// export function сlientApplicationFormItemsVisit(visitor: Visitor, ctx: CstChildrenDictionary): any[] {
//   return visitAll(visitor, ctx.Items as CstNode[])
// }
