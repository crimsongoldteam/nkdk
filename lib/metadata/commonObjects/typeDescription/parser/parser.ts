import { CstNode, CstParser } from "chevrotain"
import * as t from "~/lib/parser/lexer"

export class TypeDescriptionParser extends CstParser {
  constructor() {
    super(t.allTokens)
    this.performSelfAnalysis()
  }

  public parseTypeDescription(): CstNode {
    return this.propertyValues()
  }

  private readonly propertyValues = this.RULE("propertyValues", () => {
    this.binaryExpression(this.propertyValue, t.Comma)
  })

  private readonly propertyValue = this.RULE("propertyValue", () => {
    this.MANY1(() => {
      this.CONSUME(t.PropertiesValueText)
    })

    this.OPTION1(() => {
      this.CONSUME(t.LRound)

      this.binaryExpression(this.propertyValueOption, t.Comma)

      this.CONSUME(t.RRound)
    })
  })

  private readonly propertyValueOption = this.RULE(
    "propertyValueOption",
    () => {
      this.MANY1(() => {
        this.CONSUME(t.PropertiesValueOptionText)
      })
    }
  )

  // https://github.com/bia-technologies/yaxunit-editor
  private binaryExpression(operand: any, operator: any) {
    this.SUBRULE1(operand)
    this.MANY(() => {
      this.CONSUME(operator)
      this.SUBRULE2(operand)
    })
  }
}
