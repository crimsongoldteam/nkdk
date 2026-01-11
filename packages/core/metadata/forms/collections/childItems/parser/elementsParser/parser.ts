import { type CstNode, CstParser, EMPTY_ALT, type IToken } from "chevrotain"
import * as t from "../tokenizer/lexer"

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

  public parseCommandBar(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.commandBar()
  }

  public parseAutoCommandBar(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.autoCommandBar()
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

  public parseTable(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.table()
  }

  public parsePages(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.pages()
  }

  public parsePage(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.page()
  }

  public parseVerticalGroup(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.verticalGroup()
  }

  public parseHorizontalGroup(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.horizontalGroup()
  }

  public parseOneLineGroup(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.oneLineGroup()
  }

  public parseOneLineGroupElements(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.oneLineGroupElements()
  }

  public parsePictureDecoration(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.pictureDecoration()
  }

  public parseOtherField(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.otherField()
  }
  // #region oneLineGroupElements

  private readonly oneLineGroupElements = this.RULE("oneLineGroupElements", () => {
    this.SUBRULE(this.oneLineGroupElementsHeader)

    this.MANY_SEP({
      SEP: t.Semicolon,
      DEF: () => this.SUBRULE(this.oneLineGroupElementsContent),
    })
  })

  private readonly oneLineGroupElementsHeader = this.RULE("oneLineGroupElementsHeader", () => {
    this.CONSUME1(t.Percent, { LABEL: "OneLineGroupElementsHeaderLabel" })
    this.MANY1(() => {
      this.CONSUME(t.OneLineGroupElementsHeader, { LABEL: "OneLineGroupElementsHeaderLabel" })
    })

    this.CONSUME2(t.Percent, { LABEL: "OneLineGroupElementsHeaderLabel" })
  })

  private readonly oneLineGroupElementsContent = this.RULE("oneLineGroupElementsContent", () => {
    this.MANY1(() => {
      this.CONSUME(t.OneLineGroupElementsContent, { LABEL: "OneLineGroupElementsContentLabel" })
    })
  })

  // #endregion

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

    this.choice(
      1,
      () => {
        this.CONSUME(t.LCurly)

        this.MANY1(() => {
          this.CONSUME1(t.InputHeader, { LABEL: "InputHeaderName" })
        })

        this.OPTION1(() => {
          this.CONSUME(t.RCurly)
        })
      },
      () => {
        this.MANY2(() => {
          this.CONSUME2(t.InputHeader)
        })
      }
    )
    this.CONSUME(t.Colon)

    this.MANY3(() => {
      this.CONSUME(t.InputValue)
    })

    // this.OPTION1(() => {
    //   this.CONSUME(t.Underscore)
    //   this.MANY3(() => {
    //     this.CONSUME(t.InputModifiers)
    //   })
    // })

    this.OPTION3(() => {
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

  // #region commandBar

  private readonly commandBar = this.RULE("commandBar", () => {
    this.aligment("left")

    this.CONSUME1(t.LAngle)

    this.AT_LEAST_ONE_SEP({
      SEP: t.VBar,
      DEF: () => {
        this.SUBRULE(this.commandBarButton)
      },
    })

    this.OPTION4(() => {
      this.CONSUME3(t.RAngle)
    })

    this.OPTION5(() => {
      this.SUBRULE3(this.properties)
    })

    this.aligment("right")
  })

  private readonly commandBarButton = this.RULE("commandBarButton", () => {
    this.MANY(() => {
      this.CONSUME(t.Button)
    })
  })

  // #endregion

  // #region autoCommandBar

  private readonly autoCommandBar = this.RULE("autoCommandBar", () => {
    this.CONSUME1(t.LAngle)

    this.OPTION1(() => {
      this.MANY(() => {
        this.CONSUME1(t.Dots)
      })
      this.CONSUME1(t.VBar)
    })

    this.AT_LEAST_ONE_SEP({
      SEP: t.VBar,
      DEF: () => {
        this.SUBRULE(this.commandBarButton)
      },
    })

    this.OPTION4(() => {
      this.CONSUME3(t.RAngle)
    })
  })

  // #endregion

  // #region button

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

  // #region table

  private readonly table = this.RULE("table", () => {
    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.tableLine)
    })
  })

  private readonly tableLine = this.RULE("tableLine", () => {
    this.CONSUME1(t.VBar)

    this.AT_LEAST_ONE_SEP({
      SEP: t.VBar,
      DEF: () => {
        this.SUBRULE(this.tableCell)
      },
    })

    this.OPTION2(() => {
      this.CONSUME2(t.VBar)
    })
  })

  private readonly tableCell = this.RULE("tableCell", () => {
    this.SUBRULE(this.tableDataCell)
  })

  private readonly tableDataCell = this.RULE("tableDataCell", () => {
    // this.OPTION1(() => {
    //   this.CONSUME(t.Dots)
    // })

    // this.OPTION2(() => {
    //   this.choice(
    //     1,
    //     () => {
    //       this.CONSUME(t.CheckboxChecked)
    //     },
    //     () => {
    //       this.CONSUME(t.CheckboxUnchecked)
    //     }
    //   )
    // })

    this.OPTION3(() => {
      this.CONSUME(t.TableCell)
      this.MANY(() => {
        this.CONSUME(t.TableCellContinue, { LABEL: "TableCell" })
      })
    })

    this.OPTION4(() => {
      this.SUBRULE(this.properties)
    })
  })
  //#endregion

  // #region pages

  private readonly pages = this.RULE("pages", () => {
    this.CONSUME1(t.Slash)
    this.CONSUME2(t.Slash)
    this.MANY(() => {
      this.CONSUME(t.PageHeaderText)
    })

    this.OPTION1(() => {
      this.SUBRULE(this.properties)
    })
  })

  private readonly page = this.RULE("page", () => {
    this.CONSUME1(t.Slash)
    this.MANY(() => {
      this.CONSUME(t.PageHeaderText)
    })
    this.OPTION1(() => {
      this.SUBRULE(this.properties)
    })
  })

  // #region verticalGroup

  private readonly verticalGroup = this.RULE("verticalGroup", () => {
    this.CONSUME(t.Hash)
    this.MANY(() => {
      this.CONSUME(t.GroupHeaderText)
    })

    this.OPTION1(() => {
      this.SUBRULE(this.properties)
    })
  })

  private readonly horizontalGroup = this.RULE("horizontalGroup", () => {
    this.CONSUME(t.Percent)

    this.MANY(() => {
      this.CONSUME(t.GroupHeaderText)
    })

    this.OPTION1(() => {
      this.SUBRULE(this.properties)
    })
  })

  private readonly oneLineGroup = this.RULE("oneLineGroup", () => {
    this.CONSUME1(t.Percent)
    this.MANY(() => {
      this.CONSUME(t.GroupHeaderText)
    })

    this.OPTION1(() => {
      this.SUBRULE(this.properties)
    })

    this.CONSUME2(t.Percent)
  })

  // #region pictureDecoration

  private readonly pictureDecoration = this.RULE("pictureDecoration", () => {
    this.CONSUME(t.Picture)

    this.MANY(() => {
      this.CONSUME(t.LabelContent)
    })

    this.OPTION(() => {
      this.SUBRULE(this.properties)
    })
  })

  // #endregion

  // #region otherField
  private readonly otherField = this.RULE("otherField", () => {
    this.CONSUME(t.Question)
    this.MANY(() => {
      this.CONSUME(t.OtherFieldType)
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

  // #endregion
}

export const elementsParser = new Parser()
