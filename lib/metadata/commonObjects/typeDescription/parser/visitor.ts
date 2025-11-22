import { CstChildrenDictionary, CstElement, IToken } from "chevrotain"
import { joinTokens, visitAll } from "~/lib/parser/visitorUtils"
import { TypeDescriptionParser } from "./parser"
import { visitTypeProcessor } from "./typeProcessor"

const BaseVisitor = new TypeDescriptionParser().getBaseCstVisitorConstructor()

export class TypeDescriptionVisitor extends BaseVisitor {
  propertyValues(ctx: CstChildrenDictionary): any {
    const values = this.visitAll(ctx.propertyValue)
    return visitTypeProcessor(values)
  }

  propertyValue(ctx: CstChildrenDictionary): any {
    const value = this.joinTokens(ctx.PropertiesValueText)
    const options = this.visitAll(ctx.propertyValueOption)

    return { value: value, options: options }
  }

  propertyValueOption(ctx: CstChildrenDictionary): any {
    return this.joinTokens(ctx.PropertiesValueOptionText)
  }

  private visitAll(ctx: CstElement[], param?: any): any {
    return visitAll(this, ctx, param)
  }

  private joinTokens(tokens: CstElement[]): string | undefined {
    return joinTokens(tokens as IToken[])
  }
}
