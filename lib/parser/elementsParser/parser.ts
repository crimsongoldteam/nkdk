import { type CstNode, CstParser, EMPTY_ALT, type IToken } from "chevrotain"
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

  public parseInputField(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.inputField()
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

  // #region inputField

  private readonly inputField = this.RULE("inputField", () => {
    // this.aligment("left")

    this.MANY1(() => {
      this.CONSUME(t.InputHeader)
    })
    this.CONSUME(t.Colon)
    this.MANY2(() => {
      this.CONSUME(t.InputValue)
    })

    this.OPTION1(() => {
      this.CONSUME(t.Underscore)
      this.MANY3(() => {
        this.CONSUME(t.InputModifiers)
      })
    })

    this.OPTION2(() => {
      this.SUBRULE(this.properties)
    })

    this.aligment("right")

    // this.MANY({
    //   GATE: () => {
    //     return this.LA(1).tokenType == t.LabelFieldType && this.LA(2).tokenType == t.Underscore
    //   },
    //   DEF: () => {
    //     this.SUBRULE(this.inputFieldMultiline)
    //   },
    // })
  })
  // private readonly inputFieldMultiline = this.RULE("inputFieldMultiline", () => {
  //   this.CONSUME(t.LabelFieldType)
  //   this.AT_LEAST_ONE(() => {
  //     this.CONSUME2(t.Underscore)
  //   })
  // })
  // #endregion

  // #region properties

  private readonly properties = this.RULE("properties", () => {
    this.CONSUME(t.LCurly)

    this.MANY1(() => {
      this.CONSUME(t.PropertiesNameText)
    })

    this.OPTION2(() => {
      this.CONSUME(t.RCurly)
    })
  })

  // #endregion

  // #region etc

  private aligment(direction: "left" | "right"): void {
    const idx1 = direction === "left" ? 6 : 8
    const idx2 = idx1 + 1
    const idx3 = idx2 + 1
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
