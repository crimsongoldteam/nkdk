import { CstNode, CstParser, EMPTY_ALT, IToken } from "chevrotain"
import * as t from "../treeParser/lexer"

export class Parser extends CstParser {
  constructor() {
    super(t.allTokens)
    this.performSelfAnalysis()
  }

  public parseLabelDecoration(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.labelDecoration()
  }

  // #region labelField

  private readonly labelDecoration = this.RULE("labelDecoration", () => {
    this.aligment("left")

    this.MANY1(() => {
      this.CONSUME(t.LabelContent)
    })

    this.OPTION(() => {
      this.CONSUME(t.LCurly)
      this.MANY2(() => {
        this.CONSUME(t.Text, { LABEL: "ElementName" })
      })
      this.CONSUME(t.RCurly)
    })

    this.aligment("right")
  })

  // #endregion

  // #region etc

  private aligment(direction: "left" | "right"): void {
    let idx1 = direction === "left" ? 6 : 8
    let idx2 = idx1 + 1
    let idx3 = idx2 + 1
    this.or(idx1, [
      {
        ALT: () => {
          this.consume(idx2, t.LArrow, { LABEL: `${direction}ArrowLeft` })
        },
      },
      {
        ALT: () => {
          this.consume(idx3, t.RArrow, { LABEL: `${direction}ArrowRight` })
        },
      },
      { ALT: EMPTY_ALT },
    ])
  }

  // https://github.com/bia-technologies/yaxunit-editor
  public choice(idx = 1, ...tokens: (() => any)[]) {
    const items = tokens.map((t) => {
      return { ALT: t }
    })
    this.or(idx, items)
  }

  // https://github.com/bia-technologies/yaxunit-editor
  private binaryExpression(operand: any, operator: any) {
    this.SUBRULE1(operand)
    this.MANY(() => {
      this.CONSUME(operator)
      this.SUBRULE2(operand)
    })
  }

  // #endregion
}

export const elementsParser = new Parser()
