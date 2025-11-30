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

  public parseButton(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.button()
  }

  public parseRightTitledCheckboxField(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.rightTitledCheckboxField()
  }

  public parseLeftTitledCheckboxField(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.leftTitledCheckboxField()
  }

  public parseRadioButtonField(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.radioButtonField()
  }

  // #region labelField

  private readonly labelDecoration = this.RULE("labelDecoration", () => {
    // this.aligment("left")

    this.MANY1(() => {
      this.CONSUME(t.LabelContent)
    })

    this.OPTION2(() => {
      this.SUBRULE(this.properties)
    })

    // this.aligment("right")
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

    // this.aligment("right")
  })

  // #endregion

  // #region checkboxField

  private readonly rightTitledCheckboxField = this.RULE("rightTitledCheckboxField", () => {
    this.aligment("left")

    this.choice(
      1,
      () => {
        this.CONSUME(t.CheckboxChecked)
      },
      () => {
        this.CONSUME(t.CheckboxUnchecked)
      },
      () => {
        this.CONSUME(t.SwitchChecked)
      },
      () => {
        this.CONSUME(t.SwitchUnchecked)
      }
    )

    this.MANY(() => {
      this.CONSUME(t.CheckboxHeader)
    })

    this.OPTION(() => {
      this.SUBRULE(this.properties)
    })

    this.aligment("right")
  })

  private readonly leftTitledCheckboxField = this.RULE("leftTitledCheckboxField", () => {
    this.aligment("left")

    this.MANY1(() => {
      this.CONSUME(t.CheckboxHeader)
    })

    this.choice(
      1,
      () => {
        this.CONSUME(t.CheckboxChecked)
      },
      () => {
        this.CONSUME(t.CheckboxUnchecked)
      },
      () => {
        this.CONSUME(t.SwitchChecked)
      },
      () => {
        this.CONSUME(t.SwitchUnchecked)
      }
    )

    this.OPTION3(() => {
      this.SUBRULE(this.properties)
    })

    this.aligment("right")
  })

  // #endregion

  // #region radioButtonField

  private readonly radioButtonField = this.RULE("radioButtonField", () => {
    this.aligment("left")

    this.OPTION1(() => {
      this.MANY1(() => {
        this.CONSUME(t.RadioButtonHeader)
      })
      this.CONSUME(t.Colon)
    })

    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.radioButtonItem)
    })

    this.OPTION2(() => {
      this.SUBRULE(this.properties)
    })

    this.aligment("right")
  })

  private readonly radioButtonItem = this.RULE("radioButtonItem", () => {
    this.choice(
      1,
      () => {
        this.CONSUME(t.RadioButtonChecked)
      },
      () => {
        this.CONSUME(t.RadioButtonUnchecked)
      }
    )

    this.MANY(() => {
      this.CONSUME(t.RadioButtonValueDescription)
    })
  })

  // #endregion

  // #region button

  private readonly commandBar = this.RULE("commandBar", () => {
    // this.aligment("left")

    this.CONSUME1(t.LAngle)

    this.MANY2(() => {
      this.SUBRULE(this.button)
    })

    this.OPTION4(() => {
      this.CONSUME3(t.RAngle)
    })

    this.OPTION5(() => {
      this.SUBRULE3(this.properties)
    })

    this.aligment("right")
  })

  private readonly button = this.RULE("button", () => {
    this.CONSUME1(t.LAngle)

    this.OPTION1(() => {
      this.CONSUME1(t.Picture, { LABEL: "leftPicture" })
    })
    this.MANY(() => {
      this.CONSUME(t.Button)
    })
    this.OPTION2(() => {
      this.CONSUME2(t.Picture, { LABEL: "rightPicture" })
    })

    this.OPTION4(() => {
      this.CONSUME3(t.RAngle)
    })

    this.OPTION(() => {
      this.SUBRULE(this.properties)
    })
  })

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
  // private binaryExpression(operand: any, operator: any) {
  //   this.SUBRULE1(operand)
  //   this.MANY(() => {
  //     this.CONSUME(operator)
  //     this.SUBRULE2(operand)
  //   })
  // }

  // #endregion
}

export const elementsParser = new Parser()
